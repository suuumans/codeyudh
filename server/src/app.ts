
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from "./routes/auth.route";
import problemRouter from "./routes/problem.route";
import exicuteCode from './routes/exicuteCode.route.ts';
import submissions from './routes/submission.route.ts';
import playlist from './routes/playlist.route.ts';

const app = express()
app.use(cookieParser())
app.use(express.json())

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/problems", problemRouter)
app.use("/api/v1/exicute-code", exicuteCode)
app.use("/api/v1/submission", submissions)
app.use("/api/v1/playlist", playlist)

app.get('/test', (req, res) => {
    res.send('Server is working');
  });
  

export default app