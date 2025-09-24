
import Express from "express";
import { getAllSubmissions, getSubmissionsForProblem } from "../controllers/submission.controller.ts";
import { verifyJWT } from "../middlewares/auth.middleware.ts";


const router = Express.Router();

router.use(verifyJWT);
router.get("/", getAllSubmissions);
router.get("/:problemId", getSubmissionsForProblem);

export default router