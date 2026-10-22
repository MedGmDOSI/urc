import {useEffect} from "react";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import {Box, Snackbar, Alert, useMediaQuery, useTheme} from "@mui/material";
import {useChatStore} from "../store/chatStore";
import {useSessionStore} from "../store/sessionStore";
import {isPushConfigured, startNotifications} from "../notifications/push";
import type {ConversationRef} from "../model/common";
import {ConversationList} from "./ConversationList";
import {Conversation} from "./Conversation";
import {EmptyConversation} from "./EmptyConversation";

const POLLING_DELAY = 10000;

/** Converts the URL /messages/:type/:id into a conversation, null if invalid */
function parseConversation(type?: string, id?: string): ConversationRef | null {
    const numericId = Number(id);
    if ((type === "user" || type === "room") && Number.isInteger(numericId) && numericId > 0) {
        return {type, id: numericId};
    }
    return null;
}

/** Global state of the messenger : URL <-> store sync, data loading, notifications */
export function Messenger() {

    const {type, id} = useParams();
    const navigate = useNavigate();
    const session = useSessionStore(state => state.session);
    const selected = useChatStore(state => state.selected);
    const error = useChatStore(state => state.error);
    const setError = useChatStore(state => state.setError);
    const theme = useTheme();
    const mobile = useMediaQuery(theme.breakpoints.down("md"));

    const conversation = parseConversation(type, id);
    const invalidUrl = type !== undefined && conversation === null;

    // The URL is the source of truth for the selected conversation (F5, bookmarks, deep links)
    useEffect(() => {
        useChatStore.getState().select(conversation);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversation?.type, conversation?.id]);

    useEffect(() => {
        const {fetchUsers, fetchRooms, fetchUnread} = useChatStore.getState();
        Promise.all([fetchUsers(), fetchRooms(), fetchUnread()])
            .catch(loadError => setError(loadError.message));
    }, [setError]);

    // Push notifications + service worker listener
    useEffect(() => {
        if (session) {
            startNotifications(session).catch(console.error);
        }
        const refresh = () => {
            const store = useChatStore.getState();
            store.fetchUnread().catch(console.error);
            if (store.selected) {
                store.fetchMessages().catch(console.error);
            }
        };

        const sw = navigator.serviceWorker;

        const onMessage = (event: MessageEvent) => {
            if (event.data?.action === "open") {
                navigate(event.data.path);
                return;
            }
            console.log("Got event from sw : " + JSON.stringify(event.data));
            refresh();
        };
        sw?.addEventListener("message", onMessage);
        window.addEventListener("focus", refresh);

        // Without Pusher configured, fall back on polling
        const timer = isPushConfigured() ? null : window.setInterval(refresh, POLLING_DELAY);

        return () => {
            sw?.removeEventListener("message", onMessage);
            window.removeEventListener("focus", refresh);
            if (timer) {
                window.clearInterval(timer);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.token]);

    if (invalidUrl) {
        return <Navigate to="/messages" replace/>;
    }

    const showList = !mobile || !selected;
    const showConversation = !mobile || !!selected;

    return (
        <Box sx={{display: "flex", height: "100dvh", bgcolor: "background.default"}}>
            {showList && (
                <Box sx={{
                    width: mobile ? "100%" : 340,
                    flexShrink: 0,
                    borderRight: mobile ? 0 : 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                }}>
                    <ConversationList/>
                </Box>
            )}
            {showConversation && (
                <Box sx={{flex: 1, minWidth: 0}}>
                    {selected ? <Conversation/> : <EmptyConversation/>}
                </Box>
            )}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}
                      anchorOrigin={{vertical: "bottom", horizontal: "center"}}>
                <Alert severity="error" onClose={() => setError(null)} variant="filled">{error}</Alert>
            </Snackbar>
        </Box>
    );
}
