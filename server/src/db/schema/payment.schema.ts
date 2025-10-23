
import { pgTable, text, uuid, timestamp, unique, pgEnum, index, bigint } from "drizzle-orm/pg-core";
import { User } from "./user.schema.ts";
import { Playlist } from "./playlist.schema.ts";
import { relations } from "drizzle-orm";

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "success", "failed"]);

export const Payment = pgTable("payments", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => User.id, { onDelete: 'cascade' }),
    playlistId: uuid("playlist_id").notNull().references(() => Playlist.id, { onDelete: 'cascade' }),
    razorpayPaymentId: text("razorpay_payment_id").notNull(),
    razorpayOrderId: text("razorpay_order_id").notNull(),
    razorpaySignature: text("razorpay_signature").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(), // Amount in smallest currency unit (e.g., paise)
    status: paymentStatusEnum("status").notNull().default("pending"), // e.g., pending, success, failed
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    uniquePayment: unique("unique_user_playlist_payment").on(table.userId, table.playlistId),
    razorpayOrderIdIndex: index("idx_razorpay_order_id").on(table.razorpayOrderId),
}));

export const paymentRelations = relations(Payment, ({ one }) => ({
    user: one(User, {
        fields: [Payment.userId],
        references: [User.id]
    }),
    playlist: one(Playlist, {
        fields: [Payment.playlistId],
        references: [Playlist.id]
    })
}));