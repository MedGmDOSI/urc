import { db } from '@vercel/postgres';
import {hashPassword, isLegacyHash, verifyPassword} from "../lib/password.js";
import {createSession, jsonResponse} from "../lib/session.js";

async function handler(request) {
    try {
        const {username, password} = await request.json();
        if (typeof username !== "string" || typeof password !== "string") {
            return jsonResponse({code: "UNAUTHORIZED", message: "Identifiant ou mot de passe incorrect"}, 401);
        }

        const client = await db.connect();
        const {rowCount, rows} = await client.sql`select * from users where username = ${username}`;
        if (rowCount !== 1 || !(await verifyPassword(username, password, rows[0].password))) {
            return jsonResponse({code: "UNAUTHORIZED", message: "Identifiant ou mot de passe incorrect"}, 401);
        }
        // Old accounts (sha256) are upgraded to a salted scrypt hash on their first login
        if (isLegacyHash(rows[0].password)) {
            const upgraded = await hashPassword(password);
            await client.sql`update users set password = ${upgraded} where user_id = ${rows[0].user_id}`;
        }
        await client.sql`update users set last_login = now() where user_id = ${rows[0].user_id}`;
        const user = {id: rows[0].user_id, username: rows[0].username, email: rows[0].email, externalId: rows[0].external_id};
        const token = await createSession(user);

        return jsonResponse({token: token, username: user.username, externalId: user.externalId, id: user.id});
    } catch (error) {
        console.log(error);
        return jsonResponse({code: "SERVER_ERROR", message: String(error)}, 500);
    }
}

// Node.js runtime, Web standard signature (Request -> Response)
export const GET = handler;
export const POST = handler;
