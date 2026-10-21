import { Redis } from '@upstash/redis';
import {getConnecterUser, jsonResponse, unauthorizedResponse} from "../lib/session.js";
import {unreadKey} from "../lib/conversation.js";

const redis = Redis.fromEnv();

// Returns the unread counters of the connected user : {"user:3": 2, "room:1": 5}
async function handler(request) {
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

// Node.js runtime, Web standard signature (Request -> Response)
export const GET = handler;
export const POST = handler;
