import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const SESSION_TTL = 3600;

export function getToken(request) {
    const header = new Headers(request.headers).get('Authorization');
    if (header === undefined || header === null || header === "") {
        return null;
    }
    return header.replace("Bearer ", "");
}

export async function getConnecterUser(request) {
    const token = getToken(request);
    if (!token) {
        return null;
    }
    const user = await redis.get(token);
    if (user) {
        // Sliding expiration : each authenticated call keeps the session alive
        await redis.expire(token, SESSION_TTL);
    }
    return user;
}

export async function createSession(user) {
    const token = crypto.randomUUID().toString();
    await redis.set(token, user, { ex: SESSION_TTL });
    const userInfo = {};
    userInfo[user.id] = user;
    await redis.hset("users", userInfo);
    return token;
}

export async function deleteSession(request) {
    const token = getToken(request);
    if (token) {
        await redis.del(token);
    }
}

export async function checkSession(request) {
    const user = await getConnecterUser(request);
    return (user !== undefined && user !== null && user);
}

export function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status: status,
        headers: {'content-type': 'application/json'},
    });
}

export function unauthorizedResponse() {
    return jsonResponse({code: "UNAUTHORIZED", message: "Session expired"}, 401);
}

export function triggerNotConnected(res) {
    res.status(401).json({code: "UNAUTHORIZED", message: "Session expired"});
}
