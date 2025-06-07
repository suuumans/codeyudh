
import { pgTable, uuid, primaryKey, timestamp, unique, serial } from "drizzle-orm/pg-core";
import { User } from "./user.schema.ts";
import { Problem } from "./problem.schema.ts";
import { Submission } from "./submission.schema.ts";


// export const ProblemSolved = pgTable("problem_solved", {
//     id: serial("id"),
//     userId: uuid("user_id").notNull().references(() => User.id, { onDelete: 'cascade' }),
//     problemId: uuid("problem_id").notNull().references(() => Problem.id, { onDelete: 'cascade' }),
//     submissionId: uuid("submission_id").notNull().references(() => Submission.id, { onDelete: 'cascade' }),

//     createdAt: timestamp("created_at", { withTimezone: true}).notNull().defaultNow(),
//     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
// }, (table) => ([
//         primaryKey({ columns: [table.userId, table.problemId, table.submissionId] }),
//         unique("unique_user_problem").on(table.userId, table.problemId)
//     ])
// );


export const ProblemSolved = pgTable("problem_solved", {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => User.id, { onDelete: 'cascade' }),
    problemId: uuid("problem_id").notNull().references(() => Problem.id, { onDelete: 'cascade' }),
    submissionId: uuid("submission_id").notNull().references(() => Submission.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at", { withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ([
    // Remove the primaryKey line and just keep the unique constraint
    unique("unique_user_problem").on(table.userId, table.problemId)
]));
