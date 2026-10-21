// Conversation keys stored in Redis.
// A private conversation between A and B must be found by both, so the key
// is built from the 2 ids sorted : conv:user:<min>:<max>
export const MESSAGE_TTL = 24 * 3600;

export function conversationKey(type, connectedUserId, targetId) {
    if (type === "room") {
        return "conv:room:" + Number(targetId);
    }
    const a = Number(connectedUserId);
    const b = Number(targetId);
    return "conv:user:" + Math.min(a, b) + ":" + Math.max(a, b);
}

// Unread counters : one hash per user, field = "<type>:<id>" of the conversation
export function unreadKey(userId) {
    return "unread:" + userId;
}

export function unreadField(type, id) {
    return type + ":" + id;
}

export function isValidTarget(type, targetId) {
    return (type === "user" || type === "room") && Number.isInteger(Number(targetId)) && Number(targetId) > 0;
}
