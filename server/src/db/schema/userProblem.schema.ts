
import { relations } from "drizzle-orm";
import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { User } from "./user.schema.ts";
import { Problem } from "./problem.schema.ts";
import { Submission } from "./submission.schema.ts";

export const UserProblems = pgTable("user_problems", {
  userId: uuid("user_id").notNull().references(() => User.id, { onDelete: 'cascade' }),
  problemId: uuid("problem_id").notNull().references(() => Problem.id, { onDelete: 'cascade' }),
  submissionId: uuid("submission_id").references(() => Submission.id, { onDelete: 'set null' }), // optional
}, (table) => [
  primaryKey({ columns: [table.userId, table.problemId, table.submissionId] })
]);

// --- Define relations FOR the join table ---
// A UserProblem entry belongs to one User and one Problem
export const userProblemsRelations = relations(UserProblems, ({ one }) => ({
    user: one(User, {
      fields: [UserProblems.userId],
      references: [User.id],
    }),
    problem: one(Problem, {
      fields: [UserProblems.problemId],
      references: [Problem.id],
    }),
    submission: one(Submission, {
      fields: [UserProblems.submissionId],
      references: [Submission.id],
    }),
  }));
  
  // Optional: Export types if needed elsewhere
  export type UserProblemType = typeof UserProblems.$inferSelect;
  export type NewUserProblemType = typeof UserProblems.$inferInsert;