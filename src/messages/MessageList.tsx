import {useEffect, useRef, useState} from "react";
import {Avatar, Box, CircularProgress, Link, Typography, Chip, Popover, IconButton} from "@mui/material";
import AddReactionOutlined from "@mui/icons-material/AddReactionOutlined";
import {useChatStore} from "../store/chatStore";
import {useSessionStore} from "../store/sessionStore";
import type {Message} from "../model/common";
import {avatarColor, initials} from "./avatar";
import {REACTIONS, type ReactionKey} from "./reactions";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {dateStyle: "short", timeStyle: "short"});

/** a helper function to count reactions */
function countReactions(reactions: Message["reactions"]) {
    const counts: Partial<Record<ReactionKey, number>> = {};
    Object.values(reactions).forEach(key => {
        counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
}


function MessageBubble({message, mine, showSender, myId}: { message: Message; mine: boolean; showSender: boolean, myId?: number}) {
    const counts = countReactions(message.reactions ?? {});
    const myReaction = message.reactions?.[String(myId)];

    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const toggleReaction = useChatStore(state => state.toggleReaction);

    function pick(key: ReactionKey) {
        setAnchor(null);
        if (myId !== undefined) {
            toggleReaction(message.id, key, myId);
        }
    }

    return (
        <Box sx={{display: "flex", flexDirection: mine ? "row-reverse" : "row", alignItems: "flex-end", gap: 1, mb: 1}}>
            {!mine && (
                <Avatar sx={{width: 32, height: 32, fontSize: 13, bgcolor: avatarColor(message.senderName), visibility: showSender ? "visible" : "hidden"}}>
                    {initials(message.senderName)}
                </Avatar>
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
                {message.image && (
                    <Link href={message.image} target="_blank" rel="noopener noreferrer">
                        <Box component="img" src={message.image} alt="Image envoyée" loading="lazy"
                             sx={{display: "block", maxWidth: "100%", maxHeight: 300, borderRadius: 2, mt: 0.5}}/>
                    </Link>
                )}
                {message.content && (
                    <Typography variant="body2" sx={{whiteSpace: "pre-wrap", overflowWrap: "anywhere"}}>
                        {message.content}
                    </Typography>
                )}
                {Object.keys(counts).length > 0 && (
                <Box sx={{display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5}}>
                    {Object.entries(counts).map(([key, count]) => (
                        <Chip key={key}
                            size="small"
                            label={REACTIONS[key as ReactionKey] + " " + count}
                            variant={key === myReaction ? "filled" : "outlined"}
                            // Readable on the yellow bubble in both modes : my reaction = black chip, others = outlined
                            sx={key === myReaction
                                ? {bgcolor: "#181518", color: "#FEDB2A", "&:hover": {bgcolor: "#181518"}}
                                : mine ? {color: "inherit", borderColor: "rgba(24, 21, 24, 0.45)"} : undefined}
                            onClick={() => pick(key as ReactionKey)}
                        />
                    ))}
                </Box>
            )}

            </Box>
            <IconButton size="small" onClick={event => setAnchor(event.currentTarget)} sx={{alignSelf: "center"}}>
                <AddReactionOutlined fontSize="small"/>
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
