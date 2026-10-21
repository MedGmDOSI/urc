import {AUTHENT_HEADER, BEARER} from "../model/common";
import {CustomError} from "../model/CustomError";
import {useSessionStore} from "../store/sessionStore";

async function toError(response: Response): Promise<CustomError> {
    let body: { code?: string; message?: string } = {};
    try {
        body = await response.json();
    } catch {
        // non JSON body
    }
    const error = new CustomError(body.message || "Erreur " + response.status);
    error.code = body.code;
    error.httpStatus = response.status;
    return error;
}

/**
 * fetch() wrapper sending the session token as a Bearer header.
 * A 401 response means the session expired : the user is logged out.
 */
export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
    const session = useSessionStore.getState().session;
    const headers = new Headers(init.headers);
    if (session) {
        headers.set(AUTHENT_HEADER, BEARER + session.token);
    }
    if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
        response = await fetch(url, {...init, headers});
    } catch {
        throw new CustomError("Impossible de joindre le serveur");
    }
    if (!response.ok) {
        const error = await toError(response);
        if (response.status === 401 && session) {
            useSessionStore.getState().clearSession();
        }
        throw error;
    }
    return await response.json() as T;
}
