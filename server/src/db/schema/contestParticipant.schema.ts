import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core';
import { Contest } from './contest.schema';
import { User } from './user.schema';

export const ContestParticipant = pgTable('contest_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  contestId: uuid('contest_id').notNull().references(() => Contest.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  score: integer('score').notNull().default(0),
  rank: integer('rank'), // can be null until contest ends
  submissionTime: timestamp('submission_time', { withTimezone: true }), // for tie-breaks
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
