import PushNotifications from "@pusher/push-notifications-server";

// Sends a push notification (Pusher Beams) to the given users
export async function sendPush(externalIds, notification, data) {
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
