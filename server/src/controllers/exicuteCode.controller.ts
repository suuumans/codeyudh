
import type { Request, Response } from "express";
import { db } from "../db/db.ts";
import { Problem } from "../db/schema/problem.schema.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";
import { getJudge0LanguageId, pollBatchResults, submitBatch, type Judge0Submission } from "../utils/judge0.ts";


/**
 * @description Execute code
 * @body { source_code: string, language_id: number, stdin: string[], expected_outputs: string[], problem_id: number }
 * @route POST /api/v1/exicute-code
 * @access Private only logged in user can access
 */
export const exicuteCode = asyncHandler(async(req: Request, res: Response) => {
    try {
        const { source_code, language_id, stdin, expected_outputs, problem_id} = req.body;
        const userId = req.user?.id;

        if(!userId){
            throw new ApiError(401, "Unauthorized request - user id not found")
        }

        // 1. validate test cases
        if (!Array.isArray(stdin) || stdin.length === 0 || !Array.isArray(expected_outputs) || expected_outputs.length !== stdin.length) {
            return res.status(400).json(
                new ApiResponse(400, false, "Invalid stdin or expected_outputs")
            );
        }

        // 2. prepare each test cases for judge0 batch submission
        const submissions = stdin.map((input) => ({
            source_code,
            language_id,
            stdin: input,
        }))

        // 3. submit batch to judge0
        const submitResponse = await submitBatch(submissions);
        if (submitResponse.status !== 200) {
            throw new ApiError(submitResponse.status, submitResponse.message);
        }

        const tokens = submitResponse.map((result: { token: string }) => result.token);

        // 4. poll judge0 for results of all submitted test cases
        const results = await pollBatchResults({ tokens });
        console.log("Results: ---------->>>");
        console.log(results);

        // 5. validate each test case result
        for (let i = 0; i < results.length; i++) {
            if (results[i].status.id === 3) {
                throw new ApiError(400, `Compilation Error: Testcase ${i + 1} failed`);
            }
        }

        // retutn response
        return res.status(200).json(
            new ApiResponse(200, true, "Code executed successfully", results)
        );

    } catch (error) {
        console.error('Error executing code:', error);
        throw new ApiError(500, "Internal server error while executing code");
    }
})