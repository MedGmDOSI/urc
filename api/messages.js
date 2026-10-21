import { Redis } from '@upstash/redis';
import {getConnecterUser, jsonResponse, unauthorizedResponse} from "../lib/session.js";
import {conversationKey, isValidTarget, unreadField, unreadKey} from "../lib/conversation.js";

const redis = Redis.fromEnv();

async function handler(request) {
    try {
        const user = await getConnecterUser(request);
        if (!user) {
            return unauthorizedResponse();
        }

        const params = new URL(request.url).searchParams;
        const type = params.get("type");
        const targetId = params.get("id");
        if (!isValidTarget(type, targetId)) {
            return jsonResponse({code: "INVALID_TARGET", message: "Conversation invalide"}, 400);
        }

        const key = conversationKey(type, user.id, targetId);
        // LPUSH stores the newest first : reverse to get a chronological order
        const raw = await redis.lrange(key, 0, -1);
        const messages = raw
            .map(item => typeof item === "string" ? JSON.parse(item) : item)
            .reverse();

        // Reading a conversation marks it as read
        await redis.hdel(unreadKey(user.id), unreadField(type, Number(targetId)));

        return jsonResponse(messages);
    } catch (error) {
        console.log(error);
        return jsonResponse({code: "SERVER_ERROR", message: String(error)}, 500);
    }
}

// Node.js runtime, Web standard signature (Request -> Response)
export const GET = handler;
export const POST = handler;
