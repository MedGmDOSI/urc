import {Box, Typography} from "@mui/material";

export function EmptyConversation() {
    return (
        <Box sx={{height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.secondary", p: 3, textAlign: "center"}}>
            <Box component="img" src="/logo192.png" alt="UBO" sx={{width: 96, height: 96, borderRadius: 4, mb: 2, opacity: 0.9}}/>
            <Typography variant="h6">Aucune conversation sélectionnée</Typography>
            <Typography variant="body2">Choisissez un utilisateur ou un salon pour commencer à discuter.</Typography>
        </Box>
    );
}
