
import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar, pgEnum, timestamp, boolean, text, index } from "drizzle-orm/pg-core";
import { Problem } from "./problem.schema.ts";
import { UserProblems } from "./userProblem.schema.ts";

// This is the schema for the roles enum
export const rolesEnum = pgEnum("roles", ["ADMIN", "USER"]);

// This is the schema for the users table
export const User = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 30 }).notNull(),
  username: varchar("username", { length: 23 }).unique().notNull(),
  email: varchar("email", { length: 50 }).unique().notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  password: text("password").notNull(),

  forgetPasswordToken: varchar("forget_password_token", { length: 255 }),
  forgetPasswordTokenExpiry: timestamp("forget_password_token_expiry", { withTimezone: true }),
  resetPasswordToken: varchar("reset_password_token", { length: 255 }),
  resetPasswordTokenExpiry: timestamp("reset_password_token_expiry", { withTimezone: true }),
  refreshToken: text("refresh_token"),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("email_verification_token_expiry", { withTimezone: true }),
  
  role: rolesEnum("role").default("USER"),

  createdAt: timestamp("created_at", { withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true}).notNull().defaultNow(),
},
(table) => [
    index("idx_user_email").on(table.email),
    index("idx_user_username").on(table.username),
    index("idx_user_role").on(table.role),
  ]
);


export const usersRelations = relations(User, ({ many }) => ({
  // one to many:  User has many Problems
  createdProblems: many(Problem),

  // many to many:  User is linked to many Problems via UserProblems
  UserProblemLinks: many(UserProblems),
}));