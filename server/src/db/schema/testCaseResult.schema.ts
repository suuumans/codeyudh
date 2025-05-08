
import { pgTable, uuid, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { Submission } from "./submission.schema.ts";



export const TestCaseResult = pgTable("test_case_results", {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: varchar("submission_id").notNull().references(() => Submission.id, { onDelete: 'cascade' }),
    testCase: integer("test_case").notNull(),
    passed: boolean("passed").notNull(),
    stdout: text("stdout")?.notNull(),
    expected: text("expected").notNull(),
    stderr: text("stderr").notNull(),
    compileOutput: text("compile_output")?.notNull(),
    status: text("status").notNull(),
    time: text("time").notNull(),
    memory: text("memory")?.notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
});