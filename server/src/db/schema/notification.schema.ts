import { pgTable, uuid, text, boolean, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { User } from "./user.schema.ts";

export const notificationTypeEnum = pgEnum('notification_type', [
    'PAYMENT_SUCCESS',
    'SUBMISSION_ACCEPTED',
    'CONTEST_STARTING_SOON',
    'NEW_FEATURE'
]);

export const Notification = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => User.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    message: text("message").notNull(),
    linkUrl: text("link_url"),
    isRead: boolean("is_read").default(false).notNull(),
    // metadata can store relevant IDs like playlistId, problemId, etc.
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type NotificationType = typeof Notification.$inferSelect;
export type NewNotificationType = typeof Notification.$inferInsert;
