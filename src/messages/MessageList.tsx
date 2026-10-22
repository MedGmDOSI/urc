import {useEffect, useRef, useState} from "react";
import {Box, CircularProgress, Link, Typography, Chip, Popover, IconButton, Tooltip} from "@mui/material";
import AddReactionOutlined from "@mui/icons-material/AddReactionOutlined";
import ReplyIcon from "@mui/icons-material/Reply";
import {useChatStore} from "../store/chatStore";
import {useSessionStore} from "../store/sessionStore";
import type {Message} from "../model/common";
import {UserAvatar} from "./UserAvatar";
import {REACTIONS, type ReactionKey} from "./reactions";
import {replySummary} from "./reply";
import {Linkify} from "./Linkify";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {dateStyle: "short", timeStyle: "short"});

/** a helper function to count reactions */
function countReactions(reactions: Message["reactions"]) {
    const counts: Partial<Record<ReactionKey, number>> = {};
    Object.values(reactions).forEach(key => {
        counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
}


/** Scrolls to the original message of a reply, and flashes it */
function scrollToMessage(id: string) {
    const element = document.getElementById("message-" + id);
    element?.scrollIntoView({behavior: "smooth", block: "center"});
    element?.animate([{backgroundColor: "rgba(254, 219, 42, 0.45)"}, {backgroundColor: "transparent"}], {duration: 1500});
}

function MessageBubble({message, mine, showSender, myId}: { message: Message; mine: boolean; showSender: boolean, myId?: number}) {
    const counts = countReactions(message.reactions ?? {});
    const myReaction = message.reactions?.[String(myId)];
    const users = useChatStore(state => state.users);
    const senderAvatar = useChatStore(state => state.users.find(user => user.user_id === message.senderId)?.avatar_url);

    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const toggleReaction = useChatStore(state => state.toggleReaction);
    const setReplyingTo = useChatStore(state => state.setReplyingTo);

    /** Who reacted with this emoji : "Vous, Alice, Bob" */
    function reactorNames(key: string): string {
        return Object.entries(message.reactions ?? {})
            .filter(([, reaction]) => reaction === key)
            .map(([userId]) => Number(userId) === myId
                ? "Vous"
                : (users.find(user => user.user_id === Number(userId))?.username ?? "Utilisateur"))
            .join(", ");
    }

    function pick(key: ReactionKey) {
        setAnchor(null);
        if (myId !== undefined) {
            toggleReaction(message.id, key, myId);
        }
    }

    return (
        <Box id={"message-" + message.id} sx={{display: "flex", flexDirection: mine ? "row-reverse" : "row", alignItems: "flex-end", gap: 1, mb: 1, borderRadius: 2}}>
            {!mine && (
                <UserAvatar name={message.senderName} src={senderAvatar}
                            sx={{width: 32, height: 32, fontSize: 13, visibility: showSender ? "visible" : "hidden"}}/>
            )}
            <Box sx={{
                maxWidth: {xs: "80%", md: "65%"},
                px: 1.5,
                py: 1,
                borderRadius: 3,
                borderBottomRightRadius: mine ? 4 : undefined,
                borderBottomLeftRadius: mine ? undefined : 4,
                bgcolor: mine ? "secondary.main" : "background.paper",
                color: mine ? "secondary.contrastText" : "text.primary",
                boxShadow: 1,
            }}>
                <Typography variant="caption" sx={{display: "block", fontWeight: 600, opacity: 0.85}}>
                    {mine ? "Moi" : message.senderName} · {dateFormat.format(new Date(message.createdAt))}
                </Typography>
                {message.replyTo && (
                    <Box onClick={() => scrollToMessage(message.replyTo!.id)}
                         sx={{borderLeft: "3px solid currentColor", bgcolor: "action.hover", borderRadius: 1, pl: 1, pr: 1, py: 0.25, mt: 0.5, cursor: "pointer"}}>
                        <Typography variant="caption" sx={{display: "block", fontWeight: 700}}>{message.replyTo.senderName}</Typography>
                        <Typography variant="caption" noWrap component="div" sx={{opacity: 0.85}}>{replySummary(message.replyTo)}</Typography>
                    </Box>
                )}
                {message.image && (
                    <Link href={message.image} target="_blank" rel="noopener noreferrer">
                        <Box component="img" src={message.image} alt="Image envoyée" loading="lazy"
                             sx={{display: "block", maxWidth: "100%", maxHeight: 300, borderRadius: 2, mt: 0.5}}/>
                    </Link>
                )}
                {message.audio && (
                    <Box component="audio" controls preload="metadata" src={message.audio}
                         sx={{display: "block", width: "100%", minWidth: 220, maxWidth: 280, height: 40, mt: 0.5}}/>
                )}
                {message.content && (
                    <Typography variant="body2" sx={{whiteSpace: "pre-wrap", overflowWrap: "anywhere"}}>
                        <Linkify text={message.content}/>
                    </Typography>
                )}
                {Object.keys(counts).length > 0 && (
                <Box sx={{display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5}}>
                    {Object.entries(counts).map(([key, count]) => (
                        <Tooltip key={key} title={reactorNames(key)} arrow slotProps={{tooltip: {sx: {fontSize: 11}}}}>
                        <Chip
                            size="small"
                            label={REACTIONS[key as ReactionKey] + " " + count}
                            variant={key === myReaction || mine ? "filled" : "outlined"}
                            // Readable on the yellow bubble in both modes : my reaction = black chip,
                            // the others' reactions on my (yellow) bubble = darker yellow chip
                            sx={key === myReaction
                                ? {bgcolor: "#181518", color: "#FEDB2A", "&:hover": {bgcolor: "#181518"}}
                                : mine ? {bgcolor: "#FFFFFF", color: "#181518", border: "1px solid #B38F00", "&:hover": {bgcolor: "#CFA500"}} : undefined}
                            onClick={() => pick(key as ReactionKey)}
                        />
                        </Tooltip>
                    ))}
                </Box>
            )}

            </Box>
            <IconButton size="small" onClick={event => setAnchor(event.currentTarget)} sx={{alignSelf: "center"}} aria-label="Réagir">
                <AddReactionOutlined fontSize="small"/>
            </IconButton>
            <IconButton size="small" onClick={() => setReplyingTo(message)} sx={{alignSelf: "center", ml: mine ? 0 : -1, mr: mine ? -1 : 0}} aria-label="Répondre">
                <ReplyIcon fontSize="small"/>
            </IconButton>
            <Popover open={anchor !== null} anchorEl={anchor} onClose={() => setAnchor(null)}>
                <Box sx={{display: "flex", p: 0.5}}>
                    {(Object.keys(REACTIONS) as ReactionKey[]).map(key => (
                        <IconButton key={key} onClick={() => pick(key)}>{REACTIONS[key]}</IconButton>
                    ))}
                </Box>
            </Popover>
        </Box> 
    );
}

export function MessageList() {

    const session = useSessionStore(state => state.session);
    const messages = useChatStore(state => state.messages);
    const loading = useChatStore(state => state.loadingMessages);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll : always show the latest messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: "smooth", block: "end"});
    }, [messages.length]);

    return (
        <Box sx={{flex: 1, overflowY: "auto", p: 2}}>
            {loading && messages.length === 0 && (
                <Box sx={{display: "flex", justifyContent: "center", py: 4}}><CircularProgress size={28}/></Box>
            )}
            {!loading && messages.length === 0 && (
                <Typography sx={{py: 4, color: "text.secondary", textAlign: "center"}}>
                    Aucun message pour le moment. Dites bonjour 👋
                </Typography>
            )}
            {messages.map((message, index) => (
                <MessageBubble key={message.id}
                               message={message}
                               mine={message.senderId === session?.id}
                               myId={session?.id}
                               showSender={index === messages.length - 1 || messages[index + 1].senderId !== message.senderId}/>
            ))}
            <div ref={bottomRef}/>
        </Box>
    );
}
