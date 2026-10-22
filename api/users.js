import { sql } from "@vercel/postgres";
import {checkSession, jsonResponse, unauthorizedResponse} from "../lib/session.js";

async function handler(request) {
    try {

        const connected = await checkSession(request);
        if (!connected) {
            console.log("Not connected");
            return unauthorizedResponse();
        }

        // POST : saves the avatar of the connected user, the image was already uploaded with /api/upload.
        // (Kept in this file : the Hobby plan of Vercel is limited to 12 functions)
        if (request.method === "POST") {
            const {url} = await request.json();
            // Only accept images hosted on our Vercel Blob store
            if (typeof url !== "string" || !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
                return jsonResponse({code: "INVALID_IMAGE", message: "Image invalide"}, 400);
            }
            await sql`update users set avatar_url = ${url} where user_id = ${Number(connected.id)}`;
            return jsonResponse({url: url});
        }

        const {rowCount, rows} = await sql`select user_id, username, avatar_url, TO_CHAR((last_login AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris', 'DD/MM/YYYY HH24:MI') as last_login from users order by users.last_login desc nulls last`;
        console.log("Got " + rowCount + " users");
        if (rowCount === 0) {
            /* Vercel bug doesn't allow 204 response status */
            return new Response("[]", {
                status: 200,
                headers: {'content-type': 'application/json'},
            });
        } else {
            return new Response(JSON.stringify(rows), {
                status: 200,
                headers: {'content-type': 'application/json'},
            });
        }
    } catch (error) {
        console.log(error);
        return new Response(JSON.stringify(error), {
            status: 500,
            headers: {'content-type': 'application/json'},
        });
    }
};

// Node.js runtime, Web standard signature (Request -> Response)
export const GET = handler;
export const POST = handler;
