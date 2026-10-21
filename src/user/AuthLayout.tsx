import React from "react";
import {Avatar, Box, Paper, Typography} from "@mui/material";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";

interface Props {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

export function AuthLayout({title, subtitle, children}: Props) {
    return (
        <Box sx={[
            {minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", p: 2},
            (theme) => ({
                background: "radial-gradient(circle at 20% 20%, #cfe3ff 0, #f4f7fb 60%)",
                ...theme.applyStyles("dark", {
                    background: "radial-gradient(circle at 20% 20%, #1e3a5f 0, #0b1220 60%)",
                }),
            }),
        ]}>
            <Paper elevation={6} sx={{width: "100%", maxWidth: 420, p: {xs: 3, sm: 5}, borderRadius: 4}}>
                <Box sx={{display: "flex", flexDirection: "column", alignItems: "center", mb: 3}}>
                    <Avatar sx={{bgcolor: "primary.main", width: 56, height: 56, mb: 1.5}}>
                        <ForumRoundedIcon/>
                    </Avatar>
                    <Typography variant="h5" component="h1" sx={{fontWeight: 700}}>{title}</Typography>
                    <Typography variant="body2" sx={{color: "text.secondary"}}>{subtitle}</Typography>
                </Box>
                {children}
            </Paper>
        </Box>
    );
}
