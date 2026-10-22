import React, {useState} from "react";
import {Link as RouterLink, useLocation, useNavigate} from "react-router-dom";
import {Alert, Button, Link, Stack, TextField, Typography} from "@mui/material";
import {loginUser} from "./loginApi";
import {AuthLayout} from "./AuthLayout";
import {PasswordField} from "./PasswordField";

export function Login() {

    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setLoading(true);
        setError(null);
        try {
            await loginUser(data.get('login') as string, data.get('password') as string);
            // Go back to the page asked before the login (ex : a bookmarked conversation)
            const from = (location.state as { from?: string } | null)?.from;
            navigate(from || "/messages", {replace: true});
        } catch (loginError) {
            setError((loginError as Error).message);
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="UBO Relay Chat" subtitle="Connectez-vous pour discuter">
            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField name="login" label="Login" autoComplete="username" required autoFocus fullWidth/>
                    <PasswordField name="password" label="Mot de passe" autoComplete="current-password"/>
                    <Button type="submit" variant="contained" size="large" loading={loading} fullWidth>
                        Connexion
                    </Button>
                    <Typography variant="body2" sx={{textAlign: "center"}}>
                        Pas encore de compte ?{" "}
                        <Link component={RouterLink} to="/register">Créer un compte</Link>
                    </Typography>
                </Stack>
            </form>
        </AuthLayout>
    );
}
