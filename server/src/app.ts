
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from "./routes/auth.route";
import problemRouter from "./routes/problem.route";
import { exicuteCode } from './controllers/exicuteCode.controller';

const app = express()
app.use(cookieParser())
app.use(express.json())

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/problems", problemRouter)
app.use("/api/v1/exicute-code", exicuteCode)

app.get('/test', (req, res) => {
    res.send('Server is working');
  });
  

export default app