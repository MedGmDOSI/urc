import {Avatar} from "@mui/material";
import type {SxProps, Theme} from "@mui/material";
import {avatarColor, initials} from "./avatar";

/** Picture of the user if he uploaded one, otherwise his initials on a colored background */
export function UserAvatar({name, src, sx}: { name: string; src?: string | null; sx?: SxProps<Theme> }) {
    return (
        <Avatar src={src ?? undefined} alt={name} sx={[{bgcolor: avatarColor(name)}, ...(Array.isArray(sx) ? sx : [sx])]}>
            {initials(name)}
        </Avatar>
    );
}
