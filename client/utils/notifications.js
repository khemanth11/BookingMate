/**
 * Notifications Utility - No-op version
 * This has been neutralized to avoid Expo Go SDK 53+ issues.
 */

export async function registerForPushNotificationsAsync() {
    console.log('Push Notifications disabled by user request.');
    return null;
}

export async function sendPushNotification(expoPushToken, title, body, data = {}) {
    console.log('Sending push notification (no-op):', { title, body });
    return null;
}
