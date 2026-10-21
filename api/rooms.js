import { sql } from "@vercel/postgres";
import {getConnecterUser, jsonResponse, unauthorizedResponse} from "../lib/session";

export const config = {
    runtime: 'edge',
};

async function listRooms() {
    const {rows} = await sql`select room_id, name, TO_CHAR(created_on, 'DD/MM/YYYY HH24:MI') as created_on from rooms order by name`;
    return jsonResponse(rows);
}

async function createRoom(request, user) {
    const body = await request.json();
    const name = (body.name || "").trim();
    if (!name || name.length > 50) {
        return jsonResponse({code: "INVALID_NAME", message: "Nom de salon invalide (50 caractères max)"}, 400);
    }
    const existing = await sql`select room_id from rooms where lower(name) = lower(${name})`;
    if (existing.rowCount > 0) {
        return jsonResponse({code: "ALREADY_EXISTS", message: "Ce salon existe déjà"}, 409);
    }
    const {rows} = await sql`insert into rooms (name, created_on, created_by) values (${name}, now(), ${Number(user.id)})
        returning room_id, name, TO_CHAR(created_on, 'DD/MM/YYYY HH24:MI') as created_on`;
    return jsonResponse(rows[0], 201);
}

export default async function handler(request) {
    try {
        const user = await getConnecterUser(request);
        if (!user) {
            return unauthorizedResponse();
        }
        if (request.method === "POST") {
            return await createRoom(request, user);
        }
        return await listRooms();
    } catch (error) {
        console.log(error);
        return jsonResponse({code: "SERVER_ERROR", message: String(error)}, 500);
    }
}
