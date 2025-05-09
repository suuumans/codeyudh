
import { date, json, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { User } from "./user.schema.ts";
import { Problem } from "./problem.schema.ts";


export const Submission = pgTable("submissions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => User.id, { onDelete: 'cascade' }),
    problemId: uuid("problem_id").notNull().references(() => Problem.id, { onDelete: 'cascade' }),
    sourceCode: json("source_code").notNull(),
    language: text("language").notNull(),
    stdin: text("stdin")?.notNull(),
    stdout: text("stdout")?.notNull(),
    stderr: text("stderr"),
    compileOutput: text("compile_output"),
    status: text("status").notNull(),
    time: text("time").notNull(),
    memory: text("memory").notNull(),
    createdAt: date("created_at"),
    updatedAt: date("updated_at"),
});