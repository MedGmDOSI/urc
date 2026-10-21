import { put } from '@vercel/blob';
import {getConnecterUser, jsonResponse, unauthorizedResponse} from "../lib/session.js";

const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

// Receives the raw image as body, stores it in Vercel Blob and returns its public URL
async function handler(request) {
    try {
        const user = await getConnecterUser(request);
        if (!user) {
            return unauthorizedResponse();
        }
        if (request.method !== "POST") {
            return jsonResponse({code: "METHOD_NOT_ALLOWED", message: "POST only"}, 405);
        }

        const contentType = request.headers.get("content-type") || "";
        if (!ALLOWED_TYPES.includes(contentType)) {
            return jsonResponse({code: "INVALID_TYPE", message: "Formats acceptés : PNG, JPEG, GIF, WEBP"}, 400);
        }
        const data = await request.arrayBuffer();
        if (data.byteLength === 0 || data.byteLength > MAX_SIZE) {
            return jsonResponse({code: "INVALID_SIZE", message: "Image vide ou trop lourde (4 Mo max)"}, 400);
        }

        const extension = contentType.split("/")[1];
        const blob = await put("chat/" + user.id + "/image." + extension, data, {
            access: "public",
            contentType: contentType,
            addRandomSuffix: true,
        });

        return jsonResponse({url: blob.url});
    } catch (error) {
        console.log(error);
        return jsonResponse({code: "SERVER_ERROR", message: String(error)}, 500);
    }
}

// Node.js runtime, Web standard signature (Request -> Response)
export const GET = handler;
export const POST = handler;
