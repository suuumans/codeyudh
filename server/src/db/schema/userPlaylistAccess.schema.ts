import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { User } from "./user.schema";
import { Playlist } from "./playlist.schema";
import { relations } from "drizzle-orm";



export const UserPlaylistAccess = pgTable("user_playlist_access", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => User.id, { onDelete: 'cascade' }),
    playlistId: uuid("playlist_id").notNull().references(() => Playlist.id, { onDelete: 'cascade' }),
    grantedAt: timestamp("granted_at").notNull(),
    expiresAt: timestamp("expires_at"),
    grantSource: text("grant_source").notNull().default("payment"), // e.g., payment, invitation, trial

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    // Ensure a user can't have duplicate access records for the same playlist
    uniqueAccess: unique("unique_user_playlist_access").on(table.userId, table.playlistId),
}))

// relations
export const userPlaylistAccessRelatons = relations(UserPlaylistAccess, ({ one }) => ({
    user: one(User, {
        fields: [UserPlaylistAccess.userId],
        references: [User.id]
    }),
    playlist: one (Playlist, {
        fields: [UserPlaylistAccess.playlistId],
        references: [Playlist.id]
    })
}))