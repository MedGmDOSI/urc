import {useEffect, useRef} from "react";
import {Avatar, Box, CircularProgress, Link, Typography} from "@mui/material";
import {useChatStore} from "../store/chatStore";
import {useSessionStore} from "../store/sessionStore";
import type {Message} from "../model/common";
import {avatarColor, initials} from "./avatar";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {dateStyle: "short", timeStyle: "short"});

function MessageBubble({message, mine, showSender}: { message: Message; mine: boolean; showSender: boolean }) {
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
                bgcolor: mine ? "primary.main" : "background.paper",
                color: mine ? "primary.contrastText" : "text.primary",
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
            </Box>
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
                               showSender={index === messages.length - 1 || messages[index + 1].senderId !== message.senderId}/>
            ))}
            <div ref={bottomRef}/>
        </Box>
    );
}
