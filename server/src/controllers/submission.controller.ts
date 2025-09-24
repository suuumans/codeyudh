
import type { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler.ts"
import { ApiError } from "../utils/apiError.ts"
import { db } from "../db/db.ts"
import { and, eq } from "drizzle-orm"
import { ApiResponse } from "../utils/apiResponse.ts"
import { Submission } from "../db/schema/submission.schema.ts"



/**
 * @description Get all submissions
 * @param {string} token
 * @route GET /api/v1/submissions/get-all-submissions
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /submissions/get-all-submissions:
 *   get:
 *     tags:
 *       - Submission
 *     summary: Get all submissions
 *     description: Returns a list of all submissions for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Submissions fetched successfully.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '500':
 *         description: Internal Server Error.
 */
export const getAllSubmissions = asyncHandler(async(req: Request, res: Response) => {
    // get the user id from the request
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }

    try {
        // find user with the given id
        const submission = await db.select().from(Submission).where(eq(Submission.userId, userId))

        if(!submission || submission.length === 0){
            throw new ApiError(404, "Unauthorized request - User not found!.")
        }

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Submissions fetched successfully", submission)
        )
    } catch (error) {
        console.error("Error getting all submissions: ", error)
        throw new ApiError(500, "Internal server error while getting all submissions")
    }
})

/**
 * @description Get all submissions for a specific problem by the authenticated user.
 * @param {string} problemId - The ID of the problem.
 * @route GET /api/v1/submission/:problemId
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /submission/{problemId}:
 *   get:
 *     tags:
 *       - Submission
 *     summary: Get user's submissions for a problem
 *     description: Returns a list of all submissions made by the authenticated user for a specific problem.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: problemId
 *         in: path
 *         required: true
 *         description: The ID of the problem to retrieve submissions for.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A list of submissions for the specified problem.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '404':
 *         description: No submissions found for this problem.
 *       '500':
 *         description: Internal Server Error.
 */
export const getSubmissionsForProblem = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request - user id not found");
    }
    const { problemId } = req.params;
    if (!problemId) {
        throw new ApiError(400, "Problem id is required!");
    }

    try {
        const submissions = await db.select().from(Submission).where(and(eq(Submission.userId, userId), eq(Submission.problemId, problemId)));
    
        if (!submissions || submissions.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, true, "No submissions found for this problem.", [])
            );
        }
    
        return res.status(200).json(
            new ApiResponse(200, true, "Submissions fetched successfully", submissions)
        );
    } catch (error) {
        console.error("Error getting all submissions: ", error)
        throw new ApiError(500, "Internal server error while getting all submissions")
    }
});