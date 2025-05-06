

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as userSchema from './schema/user.schema.ts';
import * as problemSchema from './schema/problem.schema.ts';
import * as userProblemsSchema from './schema/userProblem.schema.ts';


const combinedSchema = {
  ...userSchema,
  ...problemSchema,
  ...userProblemsSchema,
};

const pool = new Pool({
  connectionString: process.env.DB_URI,
});

export const db = drizzle(pool, { schema: combinedSchema });