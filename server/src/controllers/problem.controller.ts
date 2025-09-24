
import type { Request, Response } from "express";
import { db } from "../db/db.ts";
import { eq, inArray } from "drizzle-orm";
import { Problem } from "../db/schema/problem.schema.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";
import { getJudge0LanguageId, pollBatchResults, submitBatch, type Judge0Submission } from "../utils/judge0.ts";
import { UserProblems } from "../db/schema/userProblem.schema.ts";



type NewProblemType = typeof Problem.$inferInsert;

interface Testcase {
    input: string;
    output: string;
}
  
interface ReferenceSolution {
    [language: string]: string;
}
    
interface CreateProblemRequest {
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    tags: string[];
    constraints?: string;
    examples?: any[];
    testCases: Testcase[];
    codeSnippets?: any;
    referenceSolution: ReferenceSolution;
    // Add other fields if needed
}
  

// Helper function for Judge0 validation
async function validateReferenceSolution(referenceSolution: ReferenceSolution, testCases: Testcase[]) {
    for (const [language, solutionCode] of Object.entries(referenceSolution)) {
        const languageId = getJudge0LanguageId({ language });
        if (!languageId) {
            throw new ApiError(400, `Language ${language} is not supported`);
        }
        const submissions: Judge0Submission[] = testCases.map((testCase) => ({
            source_code: solutionCode,
            language_id: languageId,
            stdin: testCase.input,
            expected_output: testCase.output
        }));
        try {
            const submissionResults = await submitBatch(submissions);
            const tokens = submissionResults.map((result: { token: string }) => result.token);
            const results = await pollBatchResults({ tokens });
            for (let i = 0; i < results.length; i++) {
                if (results[i].status.id === 3) { // Judge0 typically uses status.id: 6
                    throw new ApiError(400, `Compilation Error: Testcase ${i + 1} failed for language ${language}`);
                }
            }
        } catch (error: any) {
            console.error(`Error submitting batch for language ${language}:`, error);
            throw new ApiError(500, `Failed to validate solution for ${language}: ${error.message}`);
        }
    }
}

// helper function for finding problem by id
async function findProblemById(id: string) {
    const problem = await db.select()
        .from(Problem)
        .where(eq(Problem.id, id))
        .limit(1);
    
    if (!problem || problem.length === 0) {
        throw new ApiError(404, "Problem not found!");
    }
    
    return problem[0];
}


/**
 * @description create a problem
 * @body { title: string, description: string, difficulty: string, tags: string[], constraints: string, 
 * examples: object[], testCases: object[], codeSnippets: object[], referenceSolution: object[] }
 * @route POST /api/v1/problems/create-problem
 * @access Private only admin can access
 */

/**
 * @openapi
 * /problems/create-problem:
 *   post:
 *     tags:
 *       - Problem
 *     summary: Create a new problem
 *     description: Creates a new problem with the provided details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               constraints:
 *                 type: string
 *               examples:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     output:
 *                       type: string
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     output:
 *                       type: string
 *               codeSnippets:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   language:
 *                     type: string
 *               referenceSolution:
 *                 type: object
 *                 properties:
 *                   language:
 *                     type: string
 *                   code:
 *                     type: string
 *     responses:
 *       '200':
 *         description: Problem created successfully.
 *       '400':
 *         description: Bad Request - Invalid request data.
 *       '401':
 *         description: Unauthorized - User is not authenticated.
 *       '500':
 *         description: Internal Server Error.
 */
export const createProblem = asyncHandler(async(req: Request, res: Response) => {
    const { 
        title,
        description,
        difficulty,
        tags,
        constraints,
        examples,
        testcases,
        codeSnippets,
        referenceSolution } = req.body

        // Input validation
    if (!title || !description || !difficulty) {
        throw new ApiError(400, "Missing required fields: title, description, difficulty");
    }

    if (!testcases || !Array.isArray(testcases) || testcases.length === 0) {
        throw new ApiError(400, "Test cases are required and must be an array");
    }

    if (!referenceSolution || Object.keys(referenceSolution).length === 0) {
        throw new ApiError(400, "Reference solution is required");
    }

        try {
            // Get the user ID from the authenticated request
            const userId = req.user?.id;
            if (!userId) {
                throw new ApiError(401, "Unauthorized request - user id not found");
            }

            if (!referenceSolution || Object.keys(referenceSolution).length === 0) {
                throw new ApiError(400, "Reference solution is required");
            }

            // validate reference solution
            await validateReferenceSolution(referenceSolution, testcases)

            // If all test cases pass, we can proceed to create the problem
            const newProblemData: Partial<NewProblemType> = {
                title,
                description,
                difficulty,
                tags,
                constraints,
                examples,
                testcases,
                codeSnippets,
                referenceSolution,
                userId
            }

            // create new problem in the database
            const newProblem = await db.insert(Problem).values(
                newProblemData as NewProblemType
            ).returning()

            // return response
            return res.status(201).json(
                new ApiResponse(201, true, "Problem created successfully", newProblem[0])
            )
        } catch (error) {
            console.error("Error creating problem:", error);
            if (error instanceof ApiError) {
                throw error; // Re-throw API errors with their status codes
            }
            throw new ApiError(500, "Internal server error while creating problem");
        }

})

/**
 * @description get all problems
 * @route GET /api/v1/get-all-problems
 * @access Public anyone can access
 */

/**
 * @openapi
 * /problems/get-all-problems:
 *   get:
 *     summary: Get all problems
 *     description: Returns a list of all problems.
 *     tags:
 *       - Problem
 *     responses:
 *       '200':
 *         description: Problems fetched successfully.
 *       '404':
 *         description: Not Found - Problems not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const getAllProblems = asyncHandler(async(req: Request, res: Response) => {
    try {
        const problems = await db.select().from(Problem)
        if(!problems){
            throw new ApiError(404, "Problems not found!")
        }

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Problems fetched successfully", problems)
        )
    } catch (error) {
        console.error("Error fetching problems:", error);
        throw new ApiError(500, "Internal server error while fetching problems");
    }
})

/**
 * @description get problem by id
 * @param {string} id
 * @route GET /api/v1/get-problem/:id
 * @access Public
 */

/**
 * @openapi
 * /problems/get-problem/{id}:
 *   get:
 *     summary: Get a problem by ID
 *     description: Returns a problem with the specified ID.
 *     tags:
 *       - Problem
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the problem to retrieve.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Problem fetched successfully.
 *       '404':
 *         description: Not Found - Problem not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const getProblemById = asyncHandler(async(req: Request, res: Response) => {
    const { id } = req.params

    try {
        // find problem with the given id
        const problem = await findProblemById(id)

        if(!problem){
            throw new ApiError(404, "Problem not found!")
        }

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Problem fetched successfully", problem)
        )
    } catch (error) {
        console.error("Error fetching problem by id:", error);
        throw new ApiError(500, "Internal server error while fetching problem by id");
    }
})

/**
 * @description update problem by id
 * @param {string} id
 * @body { title: string, description: string, difficulty: string, tags: string[], constraints: string, 
 * examples: object[], testCases: object[], codeSnippets: object[], referenceSolution: object[] }
 * @route PUT /api/v1/update-problem/:id
 * @access Private only admin can access
 */

/**
 * @openapi
 * /problems/update-problem/{id}:
 *   put:
 *     summary: Update a problem by ID
 *     description: Updates a problem with the specified ID.
 *     tags:
 *       - Problem
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the problem to update.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:   
 *                   type: string
 *               constraints:
 *                 type: string
 *               examples:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     output:
 *                       type: string
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     output:
 *                       type: string
 *               codeSnippets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     language:
 *                       type: string
 *                     code:
 *                       type: string
 *               referenceSolution:
 *                 type: object
 *                 properties:
 *                   language:
 *                     type: string
 *                   code:
 *                     type: string
 *     responses:
 *       '200':
 *         description: Problem updated successfully.
 *       '404':
 *         description: Not Found - Problem not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const updateProblemById = asyncHandler(async(req: Request, res: Response) => {
    const { id } = req.params
    const { title,
        description,
        difficulty,
        tags,
        constraints,
        examples,
        testCases,
        codeSnippets,
        referenceSolution } = req.body

    try {
        // find problem with the given id
        const problem = await findProblemById(id)

        if(!problem){
            throw new ApiError(404, "Problem not found!")
        }

        if(referenceSolution && testCases){
            // If only one is provided, fetch the other from DB
            const testsToUse = testCases ?? problem.testcases;
            const solutionToUse = referenceSolution ?? problem.referenceSolution;
    
            // validate reference solution
            await validateReferenceSolution(solutionToUse, testsToUse)
        }

        // update problem
        const updatedProblem = await db.update(Problem).set({
            title: title ?? problem.title,
            description: description ?? problem.description,
            difficulty: difficulty ?? problem.difficulty,
            tags: tags ?? problem.tags,
            constraints: constraints ?? problem.constraints,
            examples: examples ?? problem.examples,
            testcases: testCases ?? problem.testcases,
            codeSnippets: codeSnippets ?? problem.codeSnippets,
            referenceSolution: referenceSolution ?? problem.referenceSolution,
        }).where(eq(Problem.id, id)).returning()

        if(!updatedProblem || updatedProblem.length === 0){
            throw new ApiError(500, "Failed to update problem. Please try again later!")
        }

        // return response
        return res.status(201).json(
            new ApiResponse(201, true, "Problem updated successfully", updatedProblem[0])
        )
    } catch (error) {
        console.error("Error updating problem by id:", error);
        throw new ApiError(500, "Internal server error while updating problem by id");
    }
    
})

/**
 * @description delete problem by id
 * @param {string} id
 * @route DELETE /api/v1/delete-problem/:id
 * @access Private only admin can access
 */

/**
 * @openapi
 * /problems/delete-problem/{id}:
 *   delete:
 *     summary: Delete a problem by ID
 *     description: Deletes a problem with the specified ID.
 *     tags:
 *       - Problem
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the problem to delete.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Problem deleted successfully.
 *       '404':
 *         description: Not Found - Problem not found.
 *       '500':
 */
export const deleteProblemById = asyncHandler(async(req: Request, res: Response) => {
    const { id } = req.params

    try {
        // find problem with the given id
        const problem = await findProblemById(id)

        if(!problem){
            throw new ApiError(404, "Problem not found!")
        }

        // delete problem
        const deletedProblem = await db.delete(Problem).where(eq(Problem.id, id)).returning()

        if(!deletedProblem || deletedProblem.length === 0){
            throw new ApiError(500, "Failed to delete problem. Please try again later!")
        }

        // return response
        return res.status(201).json(
            new ApiResponse(201, true, "Problem deleted successfully", deletedProblem[0])
        )
    } catch (error) {
        console.error("Error deleting problem by id:", error);
        throw new ApiError(500, "Internal server error while deleting problem by id");
    }
})

/**
 * @description get all problems solved by user
 * @route GET /api/v1/get-all-problems-solved-by-user
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /problems/get-solved-problems:
 *   get:
 *     summary: Get all problems solved by the user
 *     description: Returns a list of problems solved by the authenticated user.
 *     tags:
 *       - Problem
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Problems fetched successfully.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '404':
 *         description: Not Found - User not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const getAllProblemsSolvedByUser = asyncHandler(async(req: Request, res: Response) => {
    // get the user id from the request
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }

    try {
        // find problems solved by user
        const userProblemLinks = await db.select().from(UserProblems).where(eq(UserProblems.userId, userId))

        if(!userProblemLinks || userProblemLinks.length === 0){
            return res.status(200).json(
                new ApiResponse(200, true, "No problems solved by the user yet", [])
            )
        }

        const problemIds = userProblemLinks.map((userProblemLink) => userProblemLink.problemId)
        const problems = await db.select().from(Problem).where(inArray(Problem.id, problemIds))

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Problems fetched successfully", problems)
        )
    } catch (error) {
        console.error("Error getting all problems solved by user:", error);
        throw new ApiError(500, "Internal server error while getting all problems solved by user");
    }
})