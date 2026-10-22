import { put } from '@vercel/blob';
import {getConnecterUser, jsonResponse, unauthorizedResponse} from "../lib/session.js";

const MAX_SIZE = 4 * 1024 * 1024;
// Allowed content types -> file extension
const ALLOWED_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/gif": "gif",
    "image/webp": "webp",
    // Voice messages recorded in the browser
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
    // Audio files picked by the user
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/aac": "aac",
    "audio/x-m4a": "m4a",
};

// Receives the raw image or voice message as body, stores it in Vercel Blob and returns its public URL
async function handler(request) {
    try {
        const user = await getConnecterUser(request);
        if (!user) {
            return unauthorizedResponse();
        }
        if (request.method !== "POST") {
            return jsonResponse({code: "METHOD_NOT_ALLOWED", message: "POST only"}, 405);
        }

        // MediaRecorder sends "audio/webm;codecs=opus" : only keep the type
        const contentType = (request.headers.get("content-type") || "").split(";")[0].trim();
        if (!ALLOWED_TYPES[contentType]) {
            return jsonResponse({code: "INVALID_TYPE", message: "Formats acceptés : PNG, JPEG, GIF, WEBP, MP3, WAV, M4A, AAC, OGG, WEBM"}, 400);
        }
        const data = await request.arrayBuffer();
        if (data.byteLength === 0 || data.byteLength > MAX_SIZE) {
            return jsonResponse({code: "INVALID_SIZE", message: "Fichier vide ou trop lourd (4 Mo max)"}, 400);
        }

        const extension = ALLOWED_TYPES[contentType];
        const blob = await put("chat/" + user.id + "/file." + extension, data, {
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
