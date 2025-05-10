
import express from 'express';
import { getAlllistDetails, getPlayListDetails, createPlaylist, addProblemToPlaylist, deletePlaylist, rempveProblemFromPlaylist  } from '../controllers/playlist.controller.ts';
import { verifyJWT } from '../middlewares/auth.middleware.ts';

const router = express.Router();

router.use(verifyJWT);
router.get("/", getAlllistDetails);
router.get('/:playlistId', getPlayListDetails);
router.post("/create-playlist", createPlaylist);
router.post("/:playlistId/add-problem", addProblemToPlaylist);
router.delete("/:playlistId", deletePlaylist);
router.delete("/:playlistId/remove-problem", rempveProblemFromPlaylist);


export default router