
import express from "express";
import { executeCode } from "../controllers/executeCode.controller.ts";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(verifyJWT);
router.post('/:problem_id', executeCode);

export default router