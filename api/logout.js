import {deleteSession, jsonResponse} from "../lib/session.js";

async function handler(request) {
    try {
        await deleteSession(request);
        return jsonResponse({ok: true});
    } catch (error) {
        console.log(error);
        return jsonResponse({code: "SERVER_ERROR", message: String(error)}, 500);
    }
}

// Node.js runtime, Web standard signature (Request -> Response)
export const GET = handler;
export const POST = handler;
