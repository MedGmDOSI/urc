import React, {useState} from "react";
import {Link as RouterLink, useNavigate} from "react-router-dom";
import {Alert, Button, Link, Stack, TextField, Typography} from "@mui/material";
import {registerUser} from "./loginApi";
import {AuthLayout} from "./AuthLayout";
import {PasswordField} from "./PasswordField";

export function Register() {

    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const password = data.get('password') as string;
        if (password !== data.get('confirm')) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // The service logs the new user in automatically
            await registerUser(data.get('login') as string, data.get('email') as string, password);
            navigate("/messages", {replace: true});
        } catch (registerError) {
            setError((registerError as Error).message);
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Créer un compte" subtitle="Rejoignez UBO Relay Chat">
            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField name="login" label="Login" autoComplete="username" required autoFocus fullWidth
                               slotProps={{htmlInput: {maxLength: 50}}}/>
                    <TextField name="email" label="Email" type="email" autoComplete="email" required fullWidth/>
                    <PasswordField name="password" label="Mot de passe" autoComplete="new-password"
                                   helperText="6 caractères minimum"/>
                    <PasswordField name="confirm" label="Confirmation" autoComplete="new-password"/>
                    <Button type="submit" variant="contained" size="large" loading={loading} fullWidth>
                        S'inscrire
                    </Button>
                    <Typography variant="body2" sx={{textAlign: "center"}}>
                        Déjà inscrit ?{" "}
                        <Link component={RouterLink} to="/login">Se connecter</Link>
                    </Typography>
                </Stack>
            </form>
        </AuthLayout>
    );
}
