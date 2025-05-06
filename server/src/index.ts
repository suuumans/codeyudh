
import app from "./app";
import { db } from "./db/db.ts";
import cors from "cors"

app.use(cors({
  origin: '*',
  credentials: true
}))

const PORT = process.env.PORT ?? 5050;

const startServer = async () => {
    try {
      // Test database connection
      const result = await db.execute('SELECT 1 as connection_test');
      console.log('✅ Database connection successful:', result);
  
      // Start Elysia server
      app.listen(PORT, () => {
        console.log(`🚝 Express server is running at http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('🚨 Database connection failed:', error);
      process.exit(1); // Exit if DB connection fails
    }
  };
  
  startServer();