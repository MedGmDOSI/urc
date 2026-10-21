import {useState} from "react";
import {IconButton, InputAdornment, TextField} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

interface Props {
    name: string;
    label: string;
    autoComplete: string;
    helperText?: string;
}

export function PasswordField({name, label, autoComplete, helperText}: Props) {
    const [visible, setVisible] = useState(false);
    return (
        <TextField
            name={name}
            label={label}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            helperText={helperText}
            required
            fullWidth
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                onClick={() => setVisible(!visible)}
                                edge="end">
                                {visible ? <VisibilityOffIcon/> : <VisibilityIcon/>}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}
