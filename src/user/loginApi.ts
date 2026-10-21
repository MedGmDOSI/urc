import type {Session} from "../model/common";
import {apiFetch} from "../api/http";
import {useSessionStore} from "../store/sessionStore";
import {stopNotifications} from "../notifications/push";
import {useChatStore} from "../store/chatStore";

export async function loginUser(username: string, password: string): Promise<Session> {
    const session = await apiFetch<Session>("/api/login", {
        method: "POST",
        body: JSON.stringify({username, password}),
    });
    useSessionStore.getState().setSession(session);
    return session;
}

export async function registerUser(username: string, email: string, password: string): Promise<Session> {
    const session = await apiFetch<Session>("/api/register", {
        method: "POST",
        body: JSON.stringify({username, email, password}),
    });
    useSessionStore.getState().setSession(session);
    return session;
}

export async function logoutUser(): Promise<void> {
    try {
        await stopNotifications();
        await apiFetch("/api/logout", {method: "POST"});
    } catch (error) {
        console.log(error);
    } finally {
        useChatStore.getState().reset();
        useSessionStore.getState().clearSession();
    }
}
