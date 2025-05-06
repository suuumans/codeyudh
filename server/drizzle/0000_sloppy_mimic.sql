CREATE TYPE "public"."difficulty" AS ENUM('EASY', 'MEDIUM', 'HARD');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."roles" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TABLE "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"tags" text[],
	"user_id" uuid NOT NULL,
	"examples" json,
	"input" text,
	"output" text,
	"constraints" text,
	"hints" text,
	"editorial" text,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"testcases" json,
	"code_snippets" json,
	"reference_solution" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(30) NOT NULL,
	"username" varchar(23) NOT NULL,
	"email" varchar(50) NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"password" text NOT NULL,
	"forget_password_token" varchar(255),
	"forget_password_token_expiry" timestamp with time zone,
	"reset_password_token" varchar(255),
	"reset_password_token_expiry" timestamp with time zone,
	"refresh_token" text,
	"verification_token" varchar,
	"email_verification_token_expiry" timestamp with time zone,
	"role" "roles" DEFAULT 'USER',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_problems" (
	"user_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	CONSTRAINT "user_problems_user_id_problem_id_pk" PRIMARY KEY("user_id","problem_id")
);
--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problems" ADD CONSTRAINT "user_problems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problems" ADD CONSTRAINT "user_problems_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_problem_userId" ON "problems" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_problem_difficulty" ON "problems" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "idx_problem_status" ON "problems" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_problem_tags" ON "problems" USING btree ("tags");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_user_role" ON "users" USING btree ("role");