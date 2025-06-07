import express from 'express';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.ts';
import {
  getAllContests,
  getContestById,
  createContest,
  updateContest,
  deleteContest,
  getContestsGroupedByStatus,
  getContestLeaderboard
} from '../controllers/contest.controller.ts';

const router = express.Router();

// Public: Get all contests, get contest by id, get grouped, get leaderboard
router.get('/', getAllContests);
router.get('/:id', getContestById);
router.get('/grouped', getContestsGroupedByStatus);
router.get('/:id/leaderboard', getContestLeaderboard);

router.use(verifyJWT)
// Admin only: Create, update, delete contest
router.post('/create-contest', isAdmin, createContest);
router.put('/update-contest/:id', isAdmin, updateContest);
router.delete('/delete-contest/:id', isAdmin, deleteContest);

export default router;
