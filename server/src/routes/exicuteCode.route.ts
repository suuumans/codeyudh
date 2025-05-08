
import express from "express";
import { exicuteCode } from "../controllers/exicuteCode.controller";

const router = express.Router();

router.post('/exicute-code', exicuteCode);

export default router