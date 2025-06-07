
import express from 'express';
import { createProblem, getAllProblems, getProblemById, updateProblemById, deleteProblemById, getAllProblemsSolvedByUser } from '../controllers/problem.controller.ts';
import { isAdmin, verifyJWT } from '../middlewares/auth.middleware.ts';

const router = express.Router();

router.use(verifyJWT)
router.post('/create-problem',isAdmin, createProblem);
router.get('/get-all-problems', getAllProblems);
router.get('/get-problem-by-id/:id', getProblemById);
router.put('/update-problem-by-id/:id', isAdmin, updateProblemById);
router.delete('/delete-problem-by-id/:id', isAdmin, deleteProblemById);
router.get('/get-solved-problems', getAllProblemsSolvedByUser);


export default router