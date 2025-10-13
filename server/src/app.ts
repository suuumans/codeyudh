import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from "./routes/auth.route";
import problemRouter from "./routes/problem.route";
import executeCode from './routes/executeCode.route.ts';
import submissions from './routes/submission.route.ts';
import playlist from './routes/playlist.route.ts';
import contestRouter from './routes/contest.route.ts';
import { setupSwagger } from './utils/swagger.ts';

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["content-type", "Authorization"]
}));

app.use(cookieParser())
app.use(express.json())

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/problems", problemRouter)
app.use("/api/v1/execute-code", executeCode)
app.use("/api/v1/submission", submissions)
app.use("/api/v1/playlist", playlist)
app.use("/api/v1/contest", contestRouter)

app.get('/test', (req, res) => {
    res.send('Server is working just fine! :)');
});

setupSwagger(app);

export default app