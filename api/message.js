import { sql } from "@vercel/postgres";
import { Redis } from '@upstash/redis';
import {getConnecterUser, triggerNotConnected} from "../lib/session.js";
import {conversationKey, isValidTarget, MESSAGE_TTL, unreadField, unreadKey} from "../lib/conversation.js";

import PushNotifications from "@pusher/push-notifications-server";

const redis = Redis.fromEnv();

const MAX_CONTENT_LENGTH = 2000;

async function sendPush(externalIds, notification, data) {
    if (!process.env.PUSHER_INSTANCE_ID || !process.env.PUSHER_SECRET_KEY || externalIds.length === 0) {
        console.log("Push notifications not configured, skipping");
        return;
    }
    const beamsClient = new PushNotifications({
        instanceId: process.env.PUSHER_INSTANCE_ID,
        secretKey: process.env.PUSHER_SECRET_KEY,
    });
    // publishToUsers accepts at most 1000 users per call
    for (let i = 0; i < externalIds.length; i += 1000) {
        await beamsClient.publishToUsers(externalIds.slice(i, i + 1000), {
            web: {
                notification: notification,
                data: data,
            },
        });
    }
}

export default async (request, response) => {
    try {
        const user = await getConnecterUser(request);
        if (user === undefined || user === null) {
            console.log("Not connected");
            triggerNotConnected(response);
            return;
        }
        if (request.method !== "POST") {
            response.status(405).json({code: "METHOD_NOT_ALLOWED", message: "POST only"});
            return;
        }

        const {type, targetId, content, image, audio} = await request.body;
        const text = (content || "").trim();
        if (!isValidTarget(type, targetId)) {
            response.status(400).json({code: "INVALID_TARGET", message: "Destinataire invalide"});
            return;
        }
        if (!text && !image && !audio) {
            response.status(400).json({code: "EMPTY_MESSAGE", message: "Message vide"});
            return;
        }
        if (text.length > MAX_CONTENT_LENGTH) {
            response.status(400).json({code: "TOO_LONG", message: "Message trop long"});
            return;
        }
        // Only accept images hosted on our Vercel Blob store
        if (image && !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(image)) {
            response.status(400).json({code: "INVALID_IMAGE", message: "Image invalide"});
            return;
        }
        // Same rule for voice messages
        if (audio && !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(audio)) {
            response.status(400).json({code: "INVALID_AUDIO", message: "Message vocal invalide"});
            return;
        }

        // Find the recipients : the target user, or every other user for a room
        let recipients;
        let roomName = null;
        if (type === "user") {
            if (Number(targetId) === Number(user.id)) {
                response.status(400).json({code: "INVALID_TARGET", message: "Impossible de s'écrire à soi-même"});
                return;
            }
            const {rows} = await sql`select user_id, external_id from users where user_id = ${Number(targetId)}`;
            recipients = rows;
        } else {
            const room = await sql`select name from rooms where room_id = ${Number(targetId)}`;
            if (room.rowCount === 1) {
                roomName = room.rows[0].name;
                const {rows} = await sql`select user_id, external_id from users where user_id <> ${Number(user.id)}`;
                recipients = rows;
            }
        }
        if (!recipients || (type === "user" && recipients.length === 0)) {
            response.status(404).json({code: "NOT_FOUND", message: "Destinataire introuvable"});
            return;
        }

        const message = {
            id: crypto.randomUUID().toString(),
            senderId: Number(user.id),
            senderName: user.username,
            content: text,
            image: image || null,
            audio: audio || null,
            createdAt: new Date().toISOString(),
        };

        const key = conversationKey(type, user.id, targetId);
        const pipeline = redis.pipeline();
        pipeline.lpush(key, JSON.stringify(message));
        pipeline.expire(key, MESSAGE_TTL);
        // For private messages the recipient sees the conversation under the sender's id
        const field = type === "user" ? unreadField("user", user.id) : unreadField("room", targetId);
        recipients.forEach(recipient => {
            pipeline.hincrby(unreadKey(recipient.user_id), field, 1);
        });
        await pipeline.exec();

        const deepLinkPath = type === "user" ? "/messages/user/" + user.id : "/messages/room/" + targetId;
        try {
            await sendPush(
                recipients.map(recipient => recipient.external_id),
                {
                    title: roomName ? "#" + roomName + " - " + user.username : user.username,
                    body: text || (audio ? "🎤 Message vocal" : "📷 Image"),
                    icon: "https://www.univ-brest.fr/themes/custom/ubo_parent/favicon.ico",
                },
                {type: type, targetId: type === "user" ? Number(user.id) : Number(targetId), senderId: Number(user.id), path: deepLinkPath},
            );
        } catch (pushError) {
            // The message is saved, a push failure must not fail the request
            console.log("Push error", pushError);
        }

        response.status(200).json({...message, reactions: {}});
    } catch (error) {
        console.log(error);
        response.status(500).json({code: "SERVER_ERROR", message: String(error)});
    }
};
