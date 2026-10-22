/** One line describing a message, used in the quote of a reply and in the "replying to" bar */
export function replySummary(message: { content: string; image?: string | boolean | null; audio?: string | boolean | null }): string {
    if (message.content) {
        return message.content;
    }
    if (message.image) {
        return "📷 Image";
    }
    return message.audio ? "🎤 Message vocal" : "";
}
