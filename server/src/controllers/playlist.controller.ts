import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/apiError.ts";
import { db } from "../db/db.ts";
import { Playlist, ProblemInPlaylist } from "../db/schema/playlist.schema.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { and, eq } from "drizzle-orm";
import { Problem } from "../db/schema/problem.schema.ts";


/**
 * @description Create playlist
 * @body { name: string, description: string }
 * @route POST /api/v1/playlist/create-playlist
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /playlist/create-playlist:
 *   post:
 *     tags:
 *       - Playlist
 *     summary: Create playlist
 *     description: Creates a new playlist for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Playlist created successfully.
 *       '400':
 *         description: Bad Request - Playlist with same name already exists.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '500':
 *         description: Internal Server Error.
 */
export const createPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }

    try {
        // Check if playlist with same name already exists for this user
        const existingPlaylist = await db.select().from(Playlist).where(
                and(
                eq(Playlist.userId, userId),
                eq(Playlist.name, name)
                )
            )
            .limit(1);

        if (existingPlaylist.length > 0) {
            return res.status(400).json(
                new ApiResponse(400, false, "A playlist with this name already exists", null)
            );
        }
        // create playlist
        const playlist = await db.insert(Playlist).values({
            name,
            description,
            userId
        }).returning()

        // return response
        return res.status(201).json(
            new ApiResponse(201, true, "Playlist created successfully", playlist)
        )
    } catch (error) {
        console.error("Error creating playlist: ", error)
        throw new ApiError(500, "Internal server error while creating playlist")
    }
})

/**
 * @description Get all playlist
 * @headers { Authorization: Bearer <access_token> }
 * @route GET /api/v1/playlist/get-all-lists
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /playlist:
 *   get:
 *     tags:
 *       - Playlist
 *     summary: Get all user playlists
 *     description: Returns a list of all playlists for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Playlists fetched successfully.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '500':
 *         description: Internal Server Error.
 */
export const getAlllistDetails = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
        throw new ApiError(401, "Unauthorized request - user id not found")
    }
    try {
        const playlist = await db.select().from(Playlist).where(eq(Playlist.userId, userId))
        return res.status(200).json(
            new ApiResponse(200, true, "Playlist fetched successfully", playlist)
        )
    } catch (error) {
        console.error("Error fetching playlist: ", error)
        throw new ApiError(500, "Internal server error while fetching playlist")
    }
})

/**
 * @description Get details of a specific playlist
 * @headers { Authorization: Bearer <access_token> }
 * @route GET /api/v1/playlist/get-playlist/:playlistId
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /playlist/{playlistId}:
 *   get:
 *     tags:
 *       - Playlist
 *     summary: Get playlist details
 *     description: Returns the details of a specific playlist for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playlistId
 *         in: path
 *         description: ID of the playlist to retrieve.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Playlist details fetched successfully.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '404':
 *         description: Not Found - Playlist not found or you don't have access to this playlist.
 *       '500':
 *         description: Internal Server Error.
 */
export const getPlayListDetails = asyncHandler(async (req: Request, res: Response) => {
    // get the user Id & playlist id from the request
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(400, "Unauthorized request - user id not found")
    }
    const { playlistId } = req.params
    if(!playlistId){
        throw new ApiError(400, "Playlist id is required!")
    }

    try {
        // find playlist with the given id
        const playlist = await db.select().from(Playlist)
            .where(
                and(
                    eq(Playlist.userId, userId),
                    eq(Playlist.id, playlistId)
                )
            ).limit(1)

        // check if playlist exists
        if(!playlist || playlist.length === 0){
            throw new ApiError(404, "Playlist not found or you don't have access to this playlist.")
        }

        // fetch problems in this playlist
        const PlaylistProblems = await db.select().from(ProblemInPlaylist)
            .leftJoin(Problem, eq(ProblemInPlaylist.problemId, Problem.id))
            .where(eq(ProblemInPlaylist.playlistId, playlistId))

        // extract problems from the join result
        // const problems = PlaylistProblems.map((ProblemInPlaylist) => ProblemInPlaylist.problems)
        const problems = PlaylistProblems.map((joinResult) => joinResult.problems)

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Playlist details fetched successfully",
                { 
                    playlist:playlist[0],
                    problems 
                })
        )
    } catch (error) {
        console.error("Error fetching playlist: ", error)
        throw new ApiError(500, "Internal server error while fetching playlist")
    }
})

/**
 * @description Add problem to playlist
 * @headers { Authorization: Bearer <access_token> }
 * @route POST /api/v1/playlist/add-problem-to-playlist
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /playlist/{playlistId}/add-problem:
 *   post:
 *     tags:
 *       - Playlist
 *     summary: Add problem to playlist
 *     description: Adds a problem to a playlist for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playlistId
 *         in: path
 *         required: true
 *         description: The ID of the playlist to add the problem to.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               problemId:
 *                 type: string
 *                 description: ID of the problem to add to the playlist.
 *     responses:
 *       '200':
 *         description: Problem added to playlist successfully.
 *       '400':
 *         description: Bad Request - Playlist id or problem id is required.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '404':
 *         description: Not Found - Playlist not found or you don't have access to this playlist.
 *       '500':
 *         description: Internal Server Error.
 */
export const addProblemToPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const { playlistId } = req.params
    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required!")
    }
    const userId = req.user?.id
    if (!userId) {
        throw new ApiError(401, "Unauthorized request - user id not found")
    }
    const { problemId } = req.body;
    if (!problemId) {
        throw new ApiError(400, "Problem id is required!");
    }

    try {
        // Check if the playlist exists and belongs to the user
        const playlistExists = await db.select()
            .from(Playlist)
            .where(
                and(
                    eq(Playlist.id, playlistId),
                    eq(Playlist.userId, userId)
                )
            )
            .limit(1);

        if (!playlistExists || playlistExists.length === 0) {
            throw new ApiError(404, "Playlist not found or you don't have access to this playlist.");
        }
        // Check if the problem is already in the playlist
        const existing = await db.select().from(ProblemInPlaylist)
            .where(and(
                eq(ProblemInPlaylist.playlistId, playlistId),
                eq(ProblemInPlaylist.problemId, problemId)
            ))
            .limit(1);
        if (existing.length > 0) {
            return res.status(400).json(
                new ApiResponse(400, false, "Problem already exists in this playlist", null)
            );
        }
        // Add problem to playlist
        const result = await db.insert(ProblemInPlaylist).values({
            playlistId,
            problemId,
        }).returning();

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Problem added to playlist successfully", result)
        )
    } catch (error) {
        console.error("Error adding problem to playlist: ", error)
        throw new ApiError(500, "Internal server error while adding problem to playlist")
    }
})

/**
 * @description Delete playlist
 * @headers { Authorization: Bearer <access_token> }
 * @route DELETE /api/v1/playlist/:playlistId
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /playlist/{playlistId}:
 *   delete:
 *     tags:
 *       - Playlist
 *     summary: Delete playlist
 *     description: Deletes a playlist for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playlistId
 *         in: path
 *         description: ID of the playlist to delete.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Playlist deleted successfully.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '404':
 *         description: Not Found - Playlist not found or you don't have access to this playlist.
 *       '500':
 *         description: Internal Server Error.
 */
export const deletePlaylist = asyncHandler(async (req: Request, res: Response) => {
    const { playlistId } = req.params
    if(!playlistId){
        throw new ApiError(400, "Playlist id is required!")
    }
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }

    try {
        // check if the playlist is exists and belongs to the user
        const playlistExists = await db.select()
            .from(Playlist)
            .where(
                and(
                    eq(Playlist.id, playlistId),
                    eq(Playlist.userId, userId)
                )
            )
            .limit(1);

        if (!playlistExists || playlistExists.length === 0) {
            throw new ApiError(404, "Playlist not found or you don't have access to this playlist.");
        }

        // delete playlist
        const deletedPlaylist = await db.delete(Playlist).where(eq(Playlist.id, playlistId)).returning()

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Playlist deleted successfully", deletedPlaylist)
        )

    } catch (error) {
        console.error("Error deleting playlist: ", error)
        throw new ApiError(500, "Internal server error while deleting playlist")
    }
})

/**
 * @description Remove problem from playlist
 * @headers { Authorization: Bearer <access_token> }
 * @route DELETE /api/v1/playlist/:playlistId/remove-problem
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /playlist/{playlistId}/remove-problem:
 *   delete:
 *     tags:
 *       - Playlist
 *     summary: Remove problem from playlist
 *     description: Removes a problem from a playlist for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: playlistId
 *         in: path
 *         description: ID of the playlist to remove the problem from.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - problemId
 *             properties:
 *               problemId:
 *                 type: string
 *                 description: ID of the problem to remove from the playlist.
 *     responses:
 *       '200':
 *         description: Problem removed from playlist successfully.
 *       '400':
 *         description: Bad Request - Playlist id is required.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '404':
 *         description: Not Found - Playlist not found or you don't have access to this playlist.
 *       '500':
 *         description: Internal Server Error.
 */
export const removeProblemFromPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const { playlistId } = req.params
    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required!")
    }
    const userId = req.user?.id
    if (!userId) {
        throw new ApiError(401, "Unauthorized request - user id not found")
    }
    const { problemId } = req.body;
    if (!problemId) {
        throw new ApiError(400, "Problem id is required!");
    }

    try {
        // Check if the playlist exists and belongs to the user
        const playlistExists = await db.select()
            .from(Playlist)
            .where(
                and(
                    eq(Playlist.id, playlistId),
                    eq(Playlist.userId, userId)
                )
            )
            .limit(1);

        if (!playlistExists || playlistExists.length === 0) {
            throw new ApiError(404, "Playlist not found or you don't have access to this playlist.");
        }

        const result = await db.delete(ProblemInPlaylist).where(
            and(
                eq(ProblemInPlaylist.playlistId, playlistId),
                eq(ProblemInPlaylist.problemId, problemId)
            )
        ).returning()

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Problem removed from playlist successfully", result)
        )
    } catch(error) {
        console.error("Error removing problem from playlist: ", error)
        throw new ApiError(500, "Internal server error while removing problem from playlist")
    }
})