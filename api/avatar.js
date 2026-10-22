import { sql } from "@vercel/postgres";
import {getConnecterUser, jsonResponse, unauthorizedResponse} from "../lib/session.js";

// Saves the avatar of the connected user : the image was already uploaded with /api/upload
async function handler(request) {
    try {
        const user = await getConnecterUser(request);
        if (!user) {
            return unauthorizedResponse();
        }
        if (request.method !== "POST") {
            return jsonResponse({code: "METHOD_NOT_ALLOWED", message: "POST only"}, 405);
        }

        const {url} = await request.json();
        // Only accept images hosted on our Vercel Blob store
        if (typeof url !== "string" || !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
            return jsonResponse({code: "INVALID_IMAGE", message: "Image invalide"}, 400);
        }

        await sql`update users set avatar_url = ${url} where user_id = ${Number(user.id)}`;
        return jsonResponse({url: url});
    } catch (error) {
        console.log(error);
        return jsonResponse({code: "SERVER_ERROR", message: String(error)}, 500);
    }
}

// Node.js runtime, Web standard signature (Request -> Response)
export const GET = handler;
export const POST = handler;
