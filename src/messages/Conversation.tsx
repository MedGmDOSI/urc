import {useNavigate} from "react-router-dom";
import {Avatar, Box, IconButton, Toolbar, Typography, useMediaQuery, useTheme} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TagIcon from "@mui/icons-material/Tag";
import {useChatStore} from "../store/chatStore";
import {MessageList} from "./MessageList";
import {MessageInput} from "./MessageInput";
import {UserAvatar} from "./UserAvatar";

export function Conversation() {

    const navigate = useNavigate();
    const theme = useTheme();
    const mobile = useMediaQuery(theme.breakpoints.down("md"));
    const selected = useChatStore(state => state.selected);
    const users = useChatStore(state => state.users);
    const rooms = useChatStore(state => state.rooms);

    if (!selected) {
        return null;
    }
    const isRoom = selected.type === "room";
    const user = users.find(item => item.user_id === selected.id);
    const room = rooms.find(item => item.room_id === selected.id);
    const title = isRoom ? (room?.name ?? "Salon") : (user?.username ?? "Utilisateur");
    const subtitle = isRoom
        ? "Salon public"
        : (user?.last_login ? "Dernière connexion : " + user.last_login : "");

    return (
        <Box sx={{display: "flex", flexDirection: "column", height: "100%"}}>
            <Toolbar sx={{gap: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper"}}>
                {mobile && (
                    <IconButton edge="start" onClick={() => navigate("/messages")} aria-label="Retour">
                        <ArrowBackIcon/>
                    </IconButton>
                )}
                {isRoom
                    ? <Avatar variant="rounded" sx={{bgcolor: "secondary.main", color: "secondary.contrastText"}}><TagIcon/></Avatar>
                    : <UserAvatar name={title} src={user?.avatar_url}/>}
                <Box sx={{minWidth: 0}}>
                    <Typography noWrap sx={{fontWeight: 600}}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap component="div">{subtitle}</Typography>
                </Box>
            </Toolbar>
            <MessageList/>
            <MessageInput/>
        </Box>
    );
}
