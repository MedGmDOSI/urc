import {CustomError} from "./CustomError";
import type {ReactionKey} from "../messages/reactions";

export const AUTHENT_HEADER = "Authorization";
export const BEARER = "Bearer ";

export interface User {
    user_id: number;
    username: string;
    email?: string;
    password: string;
    last_login?: string;
    external_id?: string;
}

/** Public data of a user, as returned by /api/users */
export interface PublicUser {
    user_id: number;
    username: string;
    last_login: string | null;
}

export interface Room {
    room_id: number;
    name: string;
    created_on: string;
}

export type ConversationType = "user" | "room";

export interface ConversationRef {
    type: ConversationType;
    id: number;
}

export interface Message {
    id: string;
    senderId: number;
    senderName: string;
    content: string;
    image: string | null;
    reactions: Record<string, ReactionKey>;
    createdAt: string;
}

export interface Session {
    token: string;
    username?: string;
    id?: number;
    externalId: string;
}


export interface EmptyCallback {
    (): void;
}

export interface SessionCallback {
    (session: Session): void;
}


export interface ErrorCallback {
    (error: CustomError): void;
}

export function conversationField(conversation: ConversationRef): string {
    return conversation.type + ":" + conversation.id;
}
