// Password hashing with scrypt (built into Node, no dependency) : random salt per password.
// Stored format : scrypt$<salt base64>$<key base64>  (76 chars, the column is VARCHAR(100))
// Older accounts have sha256(username + password) in base64 : they are still accepted
// and transparently upgraded on their next login (see api/login.js).
import {randomBytes, scrypt, timingSafeEqual} from "node:crypto";
import {promisify} from "node:util";
import {arrayBufferToBase64, stringToArrayBuffer} from "./base64.js";

const scryptAsync = promisify(scrypt);
const PREFIX = "scrypt$";
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

function safeEqual(a, b) {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

export async function hashPassword(password) {
    const salt = randomBytes(SALT_LENGTH);
    const key = await scryptAsync(password, salt, KEY_LENGTH);
    return PREFIX + salt.toString("base64") + "$" + key.toString("base64");
}

export function isLegacyHash(stored) {
    return !stored.startsWith(PREFIX);
}

/** Returns true if the password matches the stored hash (new or legacy format) */
export async function verifyPassword(username, password, stored) {
    if (isLegacyHash(stored)) {
        const hash = await crypto.subtle.digest("SHA-256", stringToArrayBuffer(username + password));
        return safeEqual(arrayBufferToBase64(hash), stored);
    }
    const [, saltBase64, keyBase64] = stored.split("$");
    const key = await scryptAsync(password, Buffer.from(saltBase64, "base64"), KEY_LENGTH);
    return safeEqual(key.toString("base64"), keyBase64);
}
