
import express from "express";
import { exicuteCode } from "../controllers/exicuteCode.controller.ts";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(verifyJWT);
router.post('/exicute-code', exicuteCode);

export default router