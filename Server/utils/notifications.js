import { Expo } from 'expo-server-sdk';
import User from '../models/User.js';

let expo = new Expo();

/**
 * Send a push notification to a specific user
 * @param {string} userId - The recipient's user ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
export const sendNotification = async (userId, title, body, data = {}) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.expoPushToken) {
            console.log(`No push token found for user ${userId}`);
            return;
        }

        const pushToken = user.expoPushToken;

        // Check that the push token appears to be a valid Expo push token
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            return;
        }

        const messages = [{
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: data,
        }];

        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];

        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending notification chunk:', error);
            }
        }

        console.log(`Notification sent to user ${userId}: ${title}`);
    } catch (err) {
        console.error('Error in sendNotification utility:', err.message);
    }
};
