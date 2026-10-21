import React, {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    Avatar, Badge, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment,
    List, ListItemAvatar, ListItemButton, ListItemText, ListSubheader, TextField, Toolbar, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import TagIcon from "@mui/icons-material/Tag";
import {useChatStore} from "../store/chatStore";
import {useSessionStore} from "../store/sessionStore";
import {logoutUser} from "../user/loginApi";
import type {ConversationRef} from "../model/common";
import {conversationField} from "../model/common";
import {avatarColor, initials} from "./avatar";

function NewRoomDialog({open, onClose}: { open: boolean; onClose: () => void }) {
    const navigate = useNavigate();
    const createRoom = useChatStore(state => state.createRoom);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = new FormData(event.currentTarget).get("name") as string;
        setLoading(true);
        try {
            const room = await createRoom(name);
            onClose();
            navigate("/messages/room/" + room.room_id);
        } catch (createError) {
            setError((createError as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <form onSubmit={handleSubmit}>
                <DialogTitle>Nouveau salon</DialogTitle>
                <DialogContent>
                    <TextField name="name" label="Nom du salon" autoFocus required fullWidth margin="dense"
                               error={!!error} helperText={error}
                               slotProps={{htmlInput: {maxLength: 50}}}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Annuler</Button>
                    <Button type="submit" variant="contained" loading={loading}>Créer</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export function ConversationList() {

    const navigate = useNavigate();
    const session = useSessionStore(state => state.session);
    const users = useChatStore(state => state.users);
    const rooms = useChatStore(state => state.rooms);
    const unread = useChatStore(state => state.unread);
    const selected = useChatStore(state => state.selected);
    const [search, setSearch] = useState("");
    const [roomDialog, setRoomDialog] = useState(false);

    const filter = search.trim().toLowerCase();
    // The connected user is not listed
    const otherUsers = useMemo(() => users
        .filter(user => user.user_id !== session?.id)
        .filter(user => user.username.toLowerCase().includes(filter)), [users, session?.id, filter]);
    const filteredRooms = useMemo(() => rooms
        .filter(room => room.name.toLowerCase().includes(filter)), [rooms, filter]);

    const isSelected = (conversation: ConversationRef) =>
        selected?.type === conversation.type && selected.id === conversation.id;
    const unreadCount = (conversation: ConversationRef) => unread[conversationField(conversation)] || 0;

    const handleLogout = async () => {
        await logoutUser();
        navigate("/login", {replace: true});
    };

    return (
        <Box sx={{display: "flex", flexDirection: "column", height: "100%"}}>
            <Toolbar sx={{gap: 1.5, borderBottom: 1, borderColor: "divider"}}>
                <Avatar sx={{bgcolor: avatarColor(session?.username || "")}}>{initials(session?.username || "?")}</Avatar>
                <Box sx={{flex: 1, minWidth: 0}}>
                    <Typography noWrap sx={{fontWeight: 600}}>{session?.username}</Typography>
                    <Typography variant="caption" color="success.main">● En ligne</Typography>
                </Box>
                <Tooltip title="Déconnexion">
                    <IconButton onClick={handleLogout} aria-label="Déconnexion"><LogoutIcon/></IconButton>
                </Tooltip>
            </Toolbar>

            <Box sx={{p: 1.5}}>
                <TextField size="small" fullWidth placeholder="Rechercher" value={search}
                           onChange={event => setSearch(event.target.value)}
                           slotProps={{
                               input: {
                                   startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>,
                               },
                           }}/>
            </Box>

            <List sx={{flex: 1, overflowY: "auto", pt: 0}}>
                <ListSubheader sx={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                    Salons
                    <Tooltip title="Créer un salon">
                        <IconButton size="small" onClick={() => setRoomDialog(true)} aria-label="Créer un salon">
                            <AddIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                </ListSubheader>
                {filteredRooms.map(room => {
                    const conversation: ConversationRef = {type: "room", id: room.room_id};
                    const count = unreadCount(conversation);
                    return (
                        <ListItemButton key={"room-" + room.room_id} selected={isSelected(conversation)}
                                        onClick={() => navigate("/messages/room/" + room.room_id)}>
                            <ListItemAvatar>
                                <Avatar variant="rounded" sx={{bgcolor: "primary.light"}}><TagIcon/></Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={room.name}
                                          slotProps={{primary: {noWrap: true, sx: {fontWeight: count > 0 ? 700 : 400}}}}/>
                            <Badge badgeContent={count} color="primary" max={99} sx={{mr: 1}}/>
                        </ListItemButton>
                    );
                })}

                <ListSubheader>Utilisateurs</ListSubheader>
                {otherUsers.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{px: 2, py: 1}}>Aucun utilisateur</Typography>
                )}
                {otherUsers.map(user => {
                    const conversation: ConversationRef = {type: "user", id: user.user_id};
                    const count = unreadCount(conversation);
                    return (
                        <ListItemButton key={"user-" + user.user_id} selected={isSelected(conversation)}
                                        onClick={() => navigate("/messages/user/" + user.user_id)}>
                            <ListItemAvatar>
                                <Avatar sx={{bgcolor: avatarColor(user.username)}}>{initials(user.username)}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={user.username}
                                secondary={user.last_login ? "Dernière connexion : " + user.last_login : "Jamais connecté"}
                                slotProps={{
                                    primary: {noWrap: true, sx: {fontWeight: count > 0 ? 700 : 400}},
                                    secondary: {noWrap: true},
                                }}/>
                            <Badge badgeContent={count} color="primary" max={99} sx={{mr: 1}}/>
                        </ListItemButton>
                    );
                })}
            </List>

            <NewRoomDialog open={roomDialog} onClose={() => setRoomDialog(false)} key={String(roomDialog)}/>
        </Box>
    );
}
