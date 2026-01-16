import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import hpp from 'hpp';
import { serve } from 'inngest/express';
import authRouter from "./routes/auth.route";
import problemRouter from "./routes/problem.route";
import executeCode from './routes/executeCode.route.ts';
import submissions from './routes/submission.route.ts';
import playlist from './routes/playlist.route.ts';
import contestRouter from './routes/contest.route.ts';
import { setupSwagger } from './utils/swagger.ts';
import aiRouter from './routes/ai.route.ts';
import payment from './routes/payment.route.ts';
import { inngest } from './utils/notification/inngest.ts';
import { functions } from '../src/utils/notification/notification.handler.ts';
import { sanitizeMiddleware } from './middlewares/sanitize.middleware.ts';

const app = express()

// Security Middleware
app.use(helmet()); // Set various HTTP headers for security
app.use(hpp()); // Protect against HTTP Parameter Pollution attacks

// Configure CORS for production with multiple origins
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["content-type", "Authorization"],
  optionsSuccessStatus: 200
}));

// Set Permissions-Policy header to remove browser warnings
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(cookieParser())
app.use(express.json())
app.use(sanitizeMiddleware) // Sanitize all incoming requests to prevent XSS

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/problems", problemRouter)
app.use("/api/v1/execute-code", executeCode)
app.use("/api/v1/submission", submissions)
app.use("/api/v1/playlist", playlist)
app.use("/api/v1/contest", contestRouter)
app.use("/api/v1/ai", aiRouter)
app.use("/api/v1/payment", payment)


// Set up the "/api/v1/inngest" routes with the serve handler
app.use("/api/v1/inngest", serve({client: inngest, functions}));

// Test route
app.get('/test', (req, res) => {
    res.send('Server is working just fine! :)');
});

setupSwagger(app);

export default app