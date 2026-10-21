import {Client, TokenProvider} from "@pusher/push-notifications-web";
import type {Session} from "../model/common";
import {AUTHENT_HEADER, BEARER} from "../model/common";

const INSTANCE_ID = import.meta.env.VITE_PUSHER_INSTANCE_ID as string | undefined;

let beamsClient: Client | null = null;

export function isPushConfigured(): boolean {
    return !!INSTANCE_ID && "serviceWorker" in navigator && "Notification" in window;
}

/** Asks for the permission, then binds this browser to the connected user on Pusher Beams */
export async function startNotifications(session: Session): Promise<void> {
    if (!isPushConfigured()) {
        console.log("Push notifications disabled (missing VITE_PUSHER_INSTANCE_ID or unsupported browser)");
        return;
    }
    const permission = await window.Notification.requestPermission();
    if (permission !== "granted") {
        console.log("Notifications permission : " + permission);
        return;
    }

    const tokenProvider = new TokenProvider({
        url: "/api/beams",
        headers: {
            [AUTHENT_HEADER]: BEARER + session.token,
        },
    });

    beamsClient = new Client({instanceId: INSTANCE_ID!});
    await beamsClient.start();
    await beamsClient.addDeviceInterest("global");
    await beamsClient.setUserId(session.externalId, tokenProvider);
    const deviceId = await beamsClient.getDeviceId();
    console.log("Push id : " + deviceId);
}

/** Unbinds the browser from the user, so that the next user doesn't receive its notifications */
export async function stopNotifications(): Promise<void> {
    if (beamsClient) {
        await beamsClient.stop();
        beamsClient = null;
    }
}
