import { db } from '@vercel/postgres';
import {hashPassword} from "../lib/password.js";
import {createSession, jsonResponse} from "../lib/session.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handler(request) {
    try {
        const body = await request.json();
        const username = (body.username || "").trim();
        const email = (body.email || "").trim().toLowerCase();
        const password = body.password || "";

        if (!username || !email || !password) {
            return jsonResponse({code: "MISSING_FIELDS", message: "Tous les champs sont obligatoires"}, 400);
        }
        if (username.length > 50 || !/^[\w.-]+$/.test(username)) {
            return jsonResponse({code: "INVALID_USERNAME", message: "Login invalide (lettres, chiffres, . _ - ; 50 caractères max)"}, 400);
        }
        if (!EMAIL_REGEX.test(email)) {
            return jsonResponse({code: "INVALID_EMAIL", message: "Adresse email invalide"}, 400);
        }
        if (password.length < 6) {
            return jsonResponse({code: "WEAK_PASSWORD", message: "Le mot de passe doit contenir au moins 6 caractères"}, 400);
        }

        const client = await db.connect();
        const existing = await client.sql`select username, email from users where username = ${username} or email = ${email}`;
        if (existing.rowCount > 0) {
            const sameUsername = existing.rows.some(row => row.username === username);
            const message = sameUsername ? "Ce login est déjà utilisé" : "Cette adresse email est déjà utilisée";
            return jsonResponse({code: "ALREADY_EXISTS", message: message}, 409);
        }

        const hashed64 = await hashPassword(password);
        const externalId = crypto.randomUUID().toString();

        const {rows} = await client.sql`insert into users (username, password, email, created_on, last_login, external_id)
            values (${username}, ${hashed64}, ${email}, now(), now(), ${externalId})
            returning user_id`;

        // Automatic login, the new user goes straight to the messenger
        const user = {id: rows[0].user_id, username: username, email: email, externalId: externalId};
        const token = await createSession(user);

        return jsonResponse({token: token, username: username, externalId: externalId, id: user.id}, 201);
    } catch (error) {
        console.log(error);
        return jsonResponse({code: "SERVER_ERROR", message: String(error)}, 500);
    }
}

// Node.js runtime, Web standard signature (Request -> Response)
export const GET = handler;
export const POST = handler;
