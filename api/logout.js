import {deleteSession, jsonResponse} from "../lib/session";

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        await deleteSession(request);
        return jsonResponse({ok: true});
    } catch (error) {
        console.log(error);
        return jsonResponse({code: "SERVER_ERROR", message: String(error)}, 500);
    }
}
