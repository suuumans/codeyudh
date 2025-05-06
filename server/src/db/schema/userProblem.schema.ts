
import { relations } from "drizzle-orm";
import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { User } from "./user.schema.ts";
import { Problem } from "./problem.schema.ts";

export const UserProblems = pgTable("user_problems", {
  userId: uuid("user_id").notNull().references(() => User.id, { onDelete: 'cascade' }),
  problemId: uuid("problem_id").notNull().references(() => Problem.id, { onDelete: 'cascade' }),
}, (table) => ([
    primaryKey({ columns: [table.userId, table.problemId] })
])
);

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
  }));
  
  // Optional: Export types if needed elsewhere
  export type UserProblemType = typeof UserProblems.$inferSelect;
  export type NewUserProblemType = typeof UserProblems.$inferInsert;