
import Express from "express";
import { getAllSubmissions, getTheSubmissionsForProblem, getAllTheSubmissionsForProblem } from "../controllers/submission.controller.ts";
import { verifyJWT } from "../middlewares/auth.middleware.ts";


const router = Express.Router();

router.use(verifyJWT);
router.get("/get-all-submissions", getAllSubmissions);
router.get("/get-submission/:problemId", getTheSubmissionsForProblem);
router.get("/get-submissions-count/:problemId", getAllTheSubmissionsForProblem);

export default router