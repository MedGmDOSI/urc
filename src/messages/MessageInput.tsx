import React, {useEffect, useRef, useState} from "react";
import {Box, CircularProgress, IconButton, TextField, Tooltip, Typography} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import MicIcon from "@mui/icons-material/Mic";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import StopIcon from "@mui/icons-material/Stop";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import {useChatStore} from "../store/chatStore";
import {ACCEPTED_AUDIO, ACCEPTED_IMAGES, MAX_IMAGE_SIZE, uploadAudio, uploadImage} from "../api/uploadApi";

const MAX_RECORDING_SECONDS = 120;

/** First recording format supported by this browser : webm on Chrome/Firefox, mp4 on Safari */
function pickMimeType(): string | undefined {
    return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
        .find(type => MediaRecorder.isTypeSupported(type));
}

function formatDuration(seconds: number): string {
    return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}

export function MessageInput() {

    const selected = useChatStore(state => state.selected);
    const sendMessage = useChatStore(state => state.sendMessage);
    const setError = useChatStore(state => state.setError);
    const [content, setContent] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [audio, setAudio] = useState<string | null>(null);
    const [recording, setRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const recorder = useRef<MediaRecorder | null>(null);
    const chunks = useRef<Blob[]>([]);
    const cancelled = useRef(false);
    const timer = useRef<number | undefined>(undefined);
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const audioInput = useRef<HTMLInputElement>(null);
    const textInput = useRef<HTMLInputElement>(null);

    // New conversation : clear the draft
    useEffect(() => {
        setContent("");
        setImage(null);
        setAudio(null);
        cancelRecording();
        textInput.current?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.type, selected?.id]);

    // Leaving the page while recording : stop the microphone
    useEffect(() => cancelRecording, []);

    // A voice message is limited in duration
    useEffect(() => {
        if (recording && seconds >= MAX_RECORDING_SECONDS) {
            stopRecording();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seconds]);

    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            setError("L'enregistrement audio n'est pas supporté par ce navigateur");
            return;
        }
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({audio: true});
        } catch {
            setError("Accès au micro refusé");
            return;
        }

        const mimeType = pickMimeType();
        const mediaRecorder = new MediaRecorder(stream, mimeType ? {mimeType} : undefined);
        chunks.current = [];
        cancelled.current = false;
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                chunks.current.push(event.data);
            }
        };
        mediaRecorder.onstop = async () => {
            // Without this the browser keeps the microphone on
            stream.getTracks().forEach(track => track.stop());
            window.clearInterval(timer.current);
            setRecording(false);
            if (cancelled.current || chunks.current.length === 0) {
                return;
            }
            const blob = new Blob(chunks.current, {type: mediaRecorder.mimeType});
            if (blob.size > MAX_IMAGE_SIZE) {
                setError("Message vocal trop lourd (4 Mo max)");
                return;
            }
            setUploading(true);
            try {
                setAudio(await uploadAudio(blob));
            } catch (uploadError) {
                setError((uploadError as Error).message);
            } finally {
                setUploading(false);
            }
        };
        mediaRecorder.start();
        recorder.current = mediaRecorder;
        setSeconds(0);
        setRecording(true);
        timer.current = window.setInterval(() => setSeconds(value => value + 1), 1000);
    };

    /** Stops and keeps the recording : onstop uploads it */
    function stopRecording() {
        if (recorder.current?.state === "recording") {
            recorder.current.stop();
        }
    }

    /** Stops and throws the recording away */
    function cancelRecording() {
        cancelled.current = true;
        stopRecording();
    }

    const handleAudioFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            setError("Fichier audio trop lourd (4 Mo max)");
            return;
        }
        setUploading(true);
        try {
            setAudio(await uploadAudio(file));
        } catch (uploadError) {
            setError((uploadError as Error).message);
        } finally {
            setUploading(false);
        }
    };

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
        if ((!text && !image && !audio) || sending || uploading || recording) {
            return;
        }
        setSending(true);
        try {
            await sendMessage(text, image, audio);
            setContent("");
            setImage(null);
            setAudio(null);
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
            {audio && (
                <Box sx={{position: "relative", display: "inline-block", mb: 1}}>
                    <Box component="audio" controls src={audio} sx={{display: "block", height: 40}}/>
                    <IconButton size="small" onClick={() => setAudio(null)} aria-label="Retirer le message vocal"
                                sx={{position: "absolute", top: -10, right: -10, bgcolor: "background.paper", boxShadow: 1, "&:hover": {bgcolor: "background.paper"}}}>
                        <CloseIcon fontSize="small"/>
                    </IconButton>
                </Box>
            )}
            {recording ? (
                <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                    <Tooltip title="Annuler">
                        <IconButton onClick={cancelRecording} aria-label="Annuler l'enregistrement"><DeleteOutlineIcon/></IconButton>
                    </Tooltip>
                    <FiberManualRecordIcon color="error" sx={{fontSize: 14}}/>
                    <Typography sx={{flex: 1}}>{formatDuration(seconds)} / {formatDuration(MAX_RECORDING_SECONDS)}</Typography>
                    <Tooltip title="Terminer l'enregistrement">
                        <IconButton color="primary" onClick={stopRecording} aria-label="Terminer l'enregistrement"><StopIcon/></IconButton>
                    </Tooltip>
                </Box>
            ) : (
            <Box sx={{display: "flex", alignItems: "flex-end", gap: 1}}>
                <input ref={fileInput} type="file" accept={ACCEPTED_IMAGES} hidden onChange={handleFile}/>
                <Tooltip title="Envoyer une image / un GIF">
                    <span>
                        <IconButton onClick={() => fileInput.current?.click()} disabled={uploading} aria-label="Envoyer une image">
                            <ImageIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
                <input ref={audioInput} type="file" accept={ACCEPTED_AUDIO} hidden onChange={handleAudioFile}/>
                <Tooltip title="Envoyer un fichier audio">
                    <span>
                        <IconButton onClick={() => audioInput.current?.click()} disabled={uploading || sending} aria-label="Envoyer un fichier audio">
                            <AudioFileIcon/>
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Enregistrer un message vocal">
                    <span>
                        <IconButton onClick={startRecording} disabled={uploading || sending} aria-label="Enregistrer un message vocal">
                            <MicIcon/>
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
                <IconButton color="primary" onClick={submit} disabled={sending || uploading || (!content.trim() && !image && !audio)} aria-label="Envoyer">
                    {sending ? <CircularProgress size={22}/> : <SendIcon/>}
                </IconButton>
            </Box>
            )}
        </Box>
    );
}
