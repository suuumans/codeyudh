
import { date, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { User } from "./user.schema.ts";
import { relations } from "drizzle-orm";
import { Problem } from "./problem.schema.ts";



export const Playlist = pgTable("playlists", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    userId: uuid("user_id").notNull().references(() => User.id, { onDelete: 'cascade' }),
    createdAt: date("created_at"),
    updatedAt: date("updated_at"),
},
(table) => [
    unique("unique_user_playlist").on(table.userId, table.name)
])

export const ProblemInPlaylist = pgTable("problem_in_playlist", {
    id: uuid("id").primaryKey().defaultRandom(),
    playlistId: uuid("playlist_id").notNull().references(() => Playlist.id, { onDelete: 'cascade' }),
    problemId: uuid("problem_id").notNull().references(() => Problem.id, { onDelete: 'cascade' }),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
},
(table) => [
    unique("unique_playlist_problem").on(table.playlistId, table.problemId)
])

// relations
export const playlistRelations = relations(Playlist, ({ many }) => ({
    problemsInPlaylist: many(ProblemInPlaylist)
}));

export const problemInPlaylistRelations = relations(ProblemInPlaylist, ({ one }) => ({
    playlist: one(Playlist, {
        fields: [ProblemInPlaylist.playlistId],
        references: [Playlist.id]
    }),
    problem: one(Problem, {
        fields: [ProblemInPlaylist.problemId], 
        references: [Problem.id]
    })
}));