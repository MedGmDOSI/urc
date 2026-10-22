export const REACTIONS = { like: "👍", love: "❤️", laugh: "😂", surprised: "😮", sad: "😢", angry: "😠", support: "🫴" } as const;
export type ReactionKey = keyof typeof REACTIONS;
