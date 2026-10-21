const COLORS = ["#1976d2", "#9c27b0", "#2e7d32", "#ed6c02", "#d32f2f", "#0288d1", "#7b1fa2", "#00796b"];

/** Stable color per name, so that a user always gets the same avatar */
export function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) | 0;
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

export function initials(name: string): string {
    return name.slice(0, 2).toUpperCase();
}
