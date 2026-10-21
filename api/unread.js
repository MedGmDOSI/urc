import { Redis } from '@upstash/redis';
import {getConnecterUser, jsonResponse, unauthorizedResponse} from "../lib/session.js";
import {unreadKey} from "../lib/conversation.js";

export const config = {
    runtime: 'edge',
};

const redis = Redis.fromEnv();

// Returns the unread counters of the connected user : {"user:3": 2, "room:1": 5}
export default async function handler(request) {
    try {
        const user = await getConnecterUser(request);
        if (!user) {
            return unauthorizedResponse();
        }
        const counters = await redis.hgetall(unreadKey(user.id));
        return jsonResponse(counters || {});
    } catch (error) {
        console.log(error);
        return jsonResponse({code: "SERVER_ERROR", message: String(error)}, 500);
    }
}
