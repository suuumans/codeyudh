

import { relations } from 'drizzle-orm'
import { pgTable, pgEnum, uuid, timestamp, text, json, index } from 'drizzle-orm/pg-core'
import { User } from './user.schema.ts'
import { UserProblems } from './userProblem.schema.ts'

export const difficultyEnum = pgEnum('difficulty', ['EASY', 'MEDIUM', 'HARD'])
export const statusEnum = pgEnum('status', ['PENDING', 'APPROVED', 'REJECTED'])

export const Problem = pgTable('problems', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    difficulty: difficultyEnum('difficulty').notNull(),
    tags: text('tags').array(), // Array of strings like ['tag1', 'tag2', 'tag3']
    userId: uuid("user_id").notNull().references(() => User.id, { onDelete: "cascade" }), // if user is deleted, delete all problems created by that user
    examples: json('examples'),
    input: text('input'),
    output: text('output'),
    constraints: text('constraints'),
    hints: text('hints'),
    editorial: text('editorial'),
    status: statusEnum('status').notNull().default('PENDING'), // default status is PENDING
    testCases: json('testcases'), // Array of objects like [{ input: 'input1', output: 'output1' }, { input: 'input2', output: 'output2' }]
    codeSnippets: json('code_snippets'), // Array of objects like [{ language: 'language1', code: 'code1' }, { language: 'language2', code: 'code2' }]
    referenceSolution: json('reference_solution'),
    createdAt: timestamp('created_at', { withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true}).notNull().defaultNow(),
},
(table) => [
    index("idx_problem_userId").on(table.userId),
    index("idx_problem_difficulty").on(table.difficulty),
    index("idx_problem_status").on(table.status),
    index("idx_problem_tags").on(table.tags),
  ]
)

// Relation: A Problem belongs to one User (the creator)
export const problemsRelations = relations(Problem, ({ one, many }) => ({
    user: one(User, {
      fields: [Problem.userId],
      references: [User.id],
    }),

    // many to many:  Problem is linked to many Users via UserProblems
    UserProblemLinks: many(UserProblems),
  }));