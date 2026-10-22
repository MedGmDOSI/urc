import {create} from "zustand";
import type {ConversationRef, Message, PublicUser, Room} from "../model/common";
import {conversationField} from "../model/common";
import {apiFetch} from "../api/http";
import type {ReactionKey} from "../messages/reactions";

interface ChatState {
    users: PublicUser[];
    rooms: Room[];
    unread: Record<string, number>;
    selected: ConversationRef | null;
    messages: Message[];
    /** Message the next sent message answers to */
    replyingTo: Message | null;
    loadingMessages: boolean;
    error: string | null;

    fetchUsers: () => Promise<void>;
    fetchRooms: () => Promise<void>;
    fetchUnread: () => Promise<void>;
    select: (conversation: ConversationRef | null) => void;
    fetchMessages: () => Promise<void>;
    sendMessage: (content: string, image?: string | null, audio?: string | null) => Promise<void>;
    createRoom: (name: string) => Promise<Room>;
    updateAvatar: (url: string) => Promise<void>;
    setError: (error: string | null) => void;
    setReplyingTo: (message: Message | null) => void;
    reset: () => void;
    toggleReaction: (messageId: string, reaction: ReactionKey, myId: number) => Promise<void>;
}

const initialState = {
    users: [],
    rooms: [],
    unread: {},
    selected: null,
    messages: [],
    replyingTo: null,
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
        set({selected: conversation, messages: [], replyingTo: null, error: null});
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

    sendMessage: async (content, image = null, audio = null) => {
        const conversation = get().selected;
        if (!conversation) {
            return;
        }
        const message = await apiFetch<Message>("/api/message", {
            method: "POST",
            body: JSON.stringify({type: conversation.type, targetId: conversation.id, content, image, audio, replyToId: get().replyingTo?.id}),
        });
        if (sameConversation(conversation, get().selected)) {
            set({messages: [...get().messages, message]});
        }
        set({replyingTo: null});
    },

    createRoom: async (name) => {
        const room = await apiFetch<Room>("/api/rooms", {
            method: "POST",
            body: JSON.stringify({name}),
        });
        set({rooms: [...get().rooms, room].sort((a, b) => a.name.localeCompare(b.name))});
        return room;
    },

    updateAvatar: async (url) => {
        await apiFetch("/api/users", {
            method: "POST",
            body: JSON.stringify({url}),
        });
        await get().fetchUsers();
    },

    setError: (error) => set({error}),

    setReplyingTo: (message) => set({replyingTo: message}),

    reset: () => set(initialState),
    
    toggleReaction: async (messageId, reaction, myId) => {
    const conversation = get().selected;
    if (!conversation) {
        return;
    }
    const previous = get().messages;

    // 1. Optimistic update : same rule as the server (same key = remove, otherwise set)
    set({
        messages: previous.map(message => {
            if (message.id !== messageId) {
                return message;
            }
            const reactions = {...message.reactions};
            if (reactions[myId] === reaction) {
                delete reactions[myId];
            } else {
                reactions[myId] = reaction;
            }
            return {...message, reactions};
        }),
    });

    // 2. Tell the server, undo on failure
    try {
        await apiFetch("/api/reactions", {
            method: "POST",
            body: JSON.stringify({type: conversation.type, targetId: conversation.id, messageId, reaction}),
        });
    } catch (error) {
        if (sameConversation(conversation, get().selected)) {
            set({messages: previous});
        }
        get().setError((error as Error).message);
    }
},
}));
