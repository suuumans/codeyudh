import { pgTable, uuid, text, timestamp, integer, json } from 'drizzle-orm/pg-core';
import { difficultyEnum } from './problem.schema.ts';

// Difficulty enum for contests
// export const contestDifficultyEnum = pgEnum('contest_difficulty', ['EASY', 'MEDIUM', 'HARD']);

export const Contest = pgTable('contests', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  duration: integer('duration').notNull(), // in minutes
  difficulty: difficultyEnum('difficulty').notNull(),
  participants: json('participants'), // array of user ids
  problems: json('problems'), // array of problem ids
  winners: json('winners'), // array of user ids
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations can be added later if join tables are needed for participants/problems
