import { Redis } from '@upstash/redis';
import {getConnecterUser, triggerNotConnected} from "../lib/session.js";
import {conversationKey, isValidTarget, MESSAGE_TTL} from "../lib/conversation.js";
import {REACTION_KEYS} from "../lib/reactions.js";


const redis = Redis.fromEnv();

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

        const {type, targetId, messageId, reaction} = await request.body;
        if (!isValidTarget(type, targetId)) {
            response.status(400).json({code: "INVALID_TARGET", message: "Destinataire invalide"});
            return;
        }
        if (!messageId || !reaction) {
            response.status(400).json({code: "MISSING_FIELDS", message: "Champs manquants"});
            return;
        }
        if (!REACTION_KEYS.includes(reaction)) {
            response.status(400).json({code: "INVALID_REACTION", message: "Réaction invalide"});
            return;
        }
        
        const convKey = conversationKey(type, user.id, targetId);
        const raw = await redis.lrange(convKey, 0, -1);
        const exists = raw.some(item => (typeof item === "string" ? JSON.parse(item) : item).id === messageId);
        const reactionsKey = "reactions:" + messageId;

        if (!exists) {
            response.status(404).json({code: "MESSAGE_NOT_FOUND", message: "Message introuvable"});
            return;
        }

        const existingReaction = await redis.hget(reactionsKey, String(user.id));

        //check if reaction already exists for this user
        if (reaction === existingReaction) {
            await redis.hdel(reactionsKey, String(user.id));
            response.status(200).json({code: "REACTION_REMOVED", message: "Réaction supprimée", reaction: null});
            return;
        }

        //add the reaction to the message
        await redis.hset(reactionsKey, {[String(user.id)]: reaction});
        await redis.expire(reactionsKey, MESSAGE_TTL);
        response.status(200).json({code: "REACTION_ADDED_OR_UPDATED", message: "Réaction ajoutée ou mise à jour", reaction: reaction});
    
    } catch (error) {
        console.error("Error handling reaction:", error);
        response.status(500).json({code: "INTERNAL_SERVER_ERROR", message: "Erreur interne du serveur"});
    }
};