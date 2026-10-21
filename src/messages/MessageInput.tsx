import React, {useEffect, useRef, useState} from "react";
import {Box, CircularProgress, IconButton, TextField, Tooltip} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import {useChatStore} from "../store/chatStore";
import {ACCEPTED_IMAGES, MAX_IMAGE_SIZE, uploadImage} from "../api/uploadApi";

export function MessageInput() {

    const selected = useChatStore(state => state.selected);
    const sendMessage = useChatStore(state => state.sendMessage);
    const setError = useChatStore(state => state.setError);
    const [content, setContent] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const textInput = useRef<HTMLInputElement>(null);

    // New conversation : clear the draft
    useEffect(() => {
        setContent("");
        setImage(null);
        textInput.current?.focus();
    }, [selected?.type, selected?.id]);

    const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            setError("Image trop lourde (4 Mo max)");
            return;
        }
        setUploading(true);
        try {
            setImage(await uploadImage(file));
        } catch (uploadError) {
            setError((uploadError as Error).message);
        } finally {
            setUploading(false);
        }
    };

    const submit = async () => {
        const text = content.trim();
        if ((!text && !image) || sending || uploading) {
            return;
        }
        setSending(true);
        try {
            await sendMessage(text, image);
            setContent("");
            setImage(null);
        } catch (sendError) {
            setError((sendError as Error).message);
        } finally {
            setSending(false);
            textInput.current?.focus();
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        // Enter sends, Shift+Enter adds a new line
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    };

    return (
        <Box sx={{borderTop: 1, borderColor: "divider", bgcolor: "background.paper", p: 1.5}}>
            {(image || uploading) && (
                <Box sx={{position: "relative", display: "inline-block", mb: 1}}>
                    {uploading
                        ? <Box sx={{width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center"}}><CircularProgress size={24}/></Box>
                        : <Box component="img" src={image!} alt="Aperçu" sx={{height: 80, borderRadius: 2, display: "block"}}/>}
                    {image && (
                        <IconButton size="small" onClick={() => setImage(null)} aria-label="Retirer l'image"
                                    sx={{position: "absolute", top: -10, right: -10, bgcolor: "background.paper", boxShadow: 1, "&:hover": {bgcolor: "background.paper"}}}>
                            <CloseIcon fontSize="small"/>
                        </IconButton>
                    )}
                </Box>
            )}
            <Box sx={{display: "flex", alignItems: "flex-end", gap: 1}}>
                <input ref={fileInput} type="file" accept={ACCEPTED_IMAGES} hidden onChange={handleFile}/>
                <Tooltip title="Envoyer une image / un GIF">
                    <span>
                        <IconButton onClick={() => fileInput.current?.click()} disabled={uploading} aria-label="Envoyer une image">
                            <ImageIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
                <TextField
                    inputRef={textInput}
                    value={content}
                    onChange={event => setContent(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrire un message…"
                    multiline
                    maxRows={5}
                    size="small"
                    fullWidth
                    slotProps={{htmlInput: {maxLength: 2000}}}
                />
                <IconButton color="primary" onClick={submit} disabled={sending || uploading || (!content.trim() && !image)} aria-label="Envoyer">
                    {sending ? <CircularProgress size={22}/> : <SendIcon/>}
                </IconButton>
            </Box>
        </Box>
    );
}
