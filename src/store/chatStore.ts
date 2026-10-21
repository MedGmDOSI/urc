import {create} from "zustand";
import type {ConversationRef, Message, PublicUser, Room} from "../model/common";
import {conversationField} from "../model/common";
import {apiFetch} from "../api/http";

interface ChatState {
    users: PublicUser[];
    rooms: Room[];
    unread: Record<string, number>;
    selected: ConversationRef | null;
    messages: Message[];
    loadingMessages: boolean;
    error: string | null;

    fetchUsers: () => Promise<void>;
    fetchRooms: () => Promise<void>;
    fetchUnread: () => Promise<void>;
    select: (conversation: ConversationRef | null) => void;
    fetchMessages: () => Promise<void>;
    sendMessage: (content: string, image?: string | null) => Promise<void>;
    createRoom: (name: string) => Promise<Room>;
    setError: (error: string | null) => void;
    reset: () => void;
}

const initialState = {
    users: [],
    rooms: [],
    unread: {},
    selected: null,
    messages: [],
    loadingMessages: false,
    error: null,
};

function sameConversation(a: ConversationRef | null, b: ConversationRef | null) {
    return a !== null && b !== null && a.type === b.type && a.id === b.id;
}

export const useChatStore = create<ChatState>()((set, get) => ({
    ...initialState,

    fetchUsers: async () => {
        const users = await apiFetch<PublicUser[]>("/api/users");
        set({users});
    },

    fetchRooms: async () => {
        const rooms = await apiFetch<Room[]>("/api/rooms");
        set({rooms});
    },

    fetchUnread: async () => {
        const unread = await apiFetch<Record<string, number>>("/api/unread");
        // The opened conversation is being read, don't flag it
        const selected = get().selected;
        if (selected) {
            delete unread[conversationField(selected)];
        }
        set({unread});
    },

    select: (conversation) => {
        if (sameConversation(conversation, get().selected)) {
            return;
        }
        set({selected: conversation, messages: [], error: null});
        if (conversation) {
            const unread = {...get().unread};
            delete unread[conversationField(conversation)];
            set({unread});
            get().fetchMessages().catch(error => set({error: error.message}));
        }
    },

    fetchMessages: async () => {
        const conversation = get().selected;
        if (!conversation) {
            return;
        }
        set({loadingMessages: true});
        try {
            const messages = await apiFetch<Message[]>("/api/messages?type=" + conversation.type + "&id=" + conversation.id);
            // Ignore the response if the user switched conversation in the meantime
            if (sameConversation(conversation, get().selected)) {
                set({messages});
            }
        } finally {
            set({loadingMessages: false});
        }
    },

    sendMessage: async (content, image = null) => {
        const conversation = get().selected;
        if (!conversation) {
            return;
        }
        const message = await apiFetch<Message>("/api/message", {
            method: "POST",
            body: JSON.stringify({type: conversation.type, targetId: conversation.id, content, image}),
        });
        if (sameConversation(conversation, get().selected)) {
            set({messages: [...get().messages, message]});
        }
    },

    createRoom: async (name) => {
        const room = await apiFetch<Room>("/api/rooms", {
            method: "POST",
            body: JSON.stringify({name}),
        });
        set({rooms: [...get().rooms, room].sort((a, b) => a.name.localeCompare(b.name))});
        return room;
    },

    setError: (error) => set({error}),

    reset: () => set(initialState),
}));
