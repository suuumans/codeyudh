
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
        throw new ApiError(500, "Internal server error while getting all submissions"
        )
    }
})

/**
 * @description Get all submissions
 * @param {string} token
 * @route GET /api/v1/submissions/get-submission/:problemId
 * @access Private only logged in user can access
 */
export const getTheSubmissionsForProblem = asyncHandler(async (req: Request, res: Response) => {
    // get the user id from the request
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }
    const { problemId } = req.params
    if(!problemId){
        throw new ApiError(400, "Problem id is required!")
    }

    try {
        // find user with the given id
        const submissions = await db.select().from(Submission).where(and(eq(Submission.userId, userId), eq(Submission.problemId, problemId))).limit(1)

        if(!submissions || submissions.length === 0){
            throw new ApiError(404, "Unauthorized request - User not found!.")
        }

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Submissions fetched successfully", submissions)
        )
    } catch (error) {
        console.log("Error getting all submissions: ", error)
        throw new ApiError(500, "Internal server error while getting all submissions")
    }
})

export const getAllTheSubmissionsForProblem = asyncHandler(async (req: Request, res: Response) => {
    const problemId = req.params.problemId
    if(!problemId){
        throw new ApiError(400, "Problem id is required!")
    }

    try {
        // find submissions with the given problem id
        const submissions = await db.select().from(Submission).where(eq(Submission.problemId, problemId))

        if(!submissions || submissions.length === 0){
            throw new ApiError(404, "Unauthorized request - User not found!.")
        }

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Submissions fetched successfully", submissions)
        )
    } catch (error) {
        console.error("Error getting all submissions: ", error)
        throw new ApiError(500, "Internal server error while getting all submissions")
    }
})