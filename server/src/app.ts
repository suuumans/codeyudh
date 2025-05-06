
import express from 'express';
import authRouter from "./routes/auth.route";
import cookieParser from 'cookie-parser';

const app = express()
app.use(cookieParser())
app.use(express.json())

app.use("/api/v1/auth", authRouter)

app.get('/test', (req, res) => {
    res.send('Server is working');
  });
  

export default app