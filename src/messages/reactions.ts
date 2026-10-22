export const REACTIONS = { like: "👍", love: "❤️", laugh: "😂", surprised: "😮", sad: "😢", angry: "😠", confused: " 🤔" } as const;
export type ReactionKey = keyof typeof REACTIONS;
