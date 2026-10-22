import React from "react";
import {Box, Paper, Typography} from "@mui/material";

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
                background: "radial-gradient(circle at 20% 20%, #fff0a3 0, #f7f5ec 60%)",
                ...theme.applyStyles("dark", {
                    background: "radial-gradient(circle at 20% 20%, #4a3f00 0, #121212 60%)",
                }),
            }),
        ]}>
            <Paper elevation={6} sx={{width: "100%", maxWidth: 420, p: {xs: 3, sm: 5}, borderRadius: 4}}>
                <Box sx={{display: "flex", flexDirection: "column", alignItems: "center", mb: 3}}>
                    <Box component="img" src="/logo192.png" alt="UBO" sx={{width: 72, height: 72, borderRadius: 3, mb: 1.5, boxShadow: 2}}/>
                    <Typography variant="h5" component="h1" sx={{fontWeight: 700}}>{title}</Typography>
                    <Typography variant="body2" sx={{color: "text.secondary"}}>{subtitle}</Typography>
                </Box>
                {children}
            </Paper>
        </Box>
    );
}
