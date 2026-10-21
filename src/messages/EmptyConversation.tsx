import {Box, Typography} from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";

export function EmptyConversation() {
    return (
        <Box sx={{height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.secondary", p: 3, textAlign: "center"}}>
            <ChatBubbleOutlineRoundedIcon sx={{fontSize: 64, mb: 2, opacity: 0.4}}/>
            <Typography variant="h6">Aucune conversation sélectionnée</Typography>
            <Typography variant="body2">Choisissez un utilisateur ou un salon pour commencer à discuter.</Typography>
        </Box>
    );
}
