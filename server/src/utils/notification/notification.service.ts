import { db } from "../../db/db";
import { Notification } from "../../db/schema/notification.schema";
import type { NewNotificationType } from "../../db/schema/notification.schema";

/**
 * Creates a notification in the database.
 * This is the central function for creating any notification.
 * @param notificationData - The data for the new notification.
 */
export async function createNotification(notificationData: NewNotificationType) {
    try {
        await db.insert(Notification).values(notificationData);
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
}
