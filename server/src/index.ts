
// import app from "./app";
// import { db } from "./db/db.ts";

// const PORT = process.env.PORT ?? 5050;

// const startServer = async () => {
//     try {
//       // Test database connection
//       const result = await db.execute('SELECT 1 as connection_test');
//       console.log('✅ Database connection successful:', result);
  
//       // Start Elysia server
//       app.listen(PORT, () => {
//         console.log(`🚝 Express server is running at http://localhost:${PORT}`);
//       });
//     } catch (error) {
//       console.error('🚨 Database connection failed:', error);
//       process.exit(1); // Exit if DB connection fails
//     }
//   };
  
//   startServer();




import app from "./app";
import { db } from "./db/db.ts";

const PORT = process.env.PORT ?? 5050;

const testDatabaseConnection = async (retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔌 Attempting database connection... (attempt ${i + 1}/${retries})`);
      const result = await db.execute('SELECT 1 as connection_test');
      console.log('✅ Database connection successful:', result);
      return true;
    } catch (error: any) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

const startServer = async () => {
    // Check if DB_URI is provided
    if (!process.env.DB_URI) {
      console.error('🚨 DB_URI environment variable is not set!');
      console.error('Please set DB_URI in your environment variables or .env file');
      process.exit(1);
    }
    
    console.log('🔍 Database URI configured:', process.env.DB_URI.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
    
    const connected = await testDatabaseConnection();
    if (!connected) {
      console.error('🚨 Failed to connect to database after multiple attempts');
      console.error('Please check your DB_URI and ensure the database is accessible');
      process.exit(1);
    }
  
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚝 Express server is running at http://localhost:${PORT}`);
      console.log(`📄 API Docs available at http://localhost:${PORT}/api-docs`);
    });
  };
  
  startServer();