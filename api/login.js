import { db } from '@vercel/postgres';
import {arrayBufferToBase64, stringToArrayBuffer} from "../lib/base64.js";
import {createSession, jsonResponse} from "../lib/session.js";

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        const {username, password} = await request.json();
        const hash = await crypto.subtle.digest('SHA-256', stringToArrayBuffer(username + password));
        const hashed64 = arrayBufferToBase64(hash);

        const client = await db.connect();
        const {rowCount, rows} = await client.sql`select * from users where username = ${username} and password = ${hashed64}`;
        if (rowCount !== 1) {
            return jsonResponse({code: "UNAUTHORIZED", message: "Identifiant ou mot de passe incorrect"}, 401);
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
