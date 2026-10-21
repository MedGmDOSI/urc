import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";
import type {Session} from "../model/common";

interface SessionState {
    session: Session | null;
    setSession: (session: Session) => void;
    clearSession: () => void;
}

// Persisted in session storage so that the session survives a refresh (F5)
export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            session: null,
            setSession: (session) => set({session}),
            clearSession: () => set({session: null}),
        }),
        {
            name: "urc-session",
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
);
