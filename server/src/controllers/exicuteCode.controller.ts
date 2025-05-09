
import type { Request, Response } from "express";
import { db } from "../db/db.ts";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";
import { getLanguageNmae, pollBatchResults, submitBatch } from "../utils/judge0.ts";
import { Submission } from "../db/schema/submission.schema.ts";
import { ProblemSolved } from "../db/schema/problemSolved.schema.ts";
import { TestCaseResult } from "../db/schema/testCaseResult.schema.ts";


type NewSubmission = typeof Submission.$inferInsert;


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

        // analyse test case results
        let allPassed = true;
        const deailedResults = results.map(
            (
                result: { 
                    stdout: string,
                    expected_output: string,
                    stderr: string,
                    compile_output: string,
                    status: string,
                    time: number,
                    memory: number,
                    created_at: Date,
                    updated_at: Date
                },
                index: number
            ) => {
            const stdout = result.stdout?.trim();
            const expected_output = expected_outputs[index]?.trim();
            const passed = stdout === expected_output;

            if (!passed) allPassed = false;

            return {
                testCase: index + 1,
                passed,
                stdout,
                expected: expected_output,
                stderr: result.stderr ?? null,
                compileOutput: result.compile_output,
                status: result.status,
                time: result.time ? `${result.time} ms` : undefined,
                memory: result.memory ? `${result.memory} KB` : undefined,
                createdAt: result.created_at,
                updatedAt: result.updated_at
            }
            
            // console.log(`Testcase ${index + 1}: ${passed ? "Passed" : "Failed"}`);
            // console.log(`Input for Testcase ${index + 1}: ${stdin[index]}`);
            // console.log(`Expected Output for Testcase ${index + 1}: ${expected_output}`);
            // console.log(`Actual Output for Testcase ${index + 1}: ${stdout}`);

            // console.log(`Matched: ${passed}`)
            // console.log("--------------------------------------------------");

        })

        console.log(deailedResults);

        // 6. save submission summery to database
        const newSubmission: NewSubmission = {
            userId,
            problemId: problem_id,
            sourceCode: source_code,
            language: getLanguageNmae(language_id),
            stdin: stdin.join("\n"),
            stdout: JSON.stringify(deailedResults.map((result: { stdout: string }) => result.stdout)),
            stderr: deailedResults.some((result: { stderr: string }) => result.stderr) ? JSON.stringify(deailedResults.map((result: { stderr: string }) => result.stderr)) : null,
            compileOutput: deailedResults.some((result: { compile_output: string }) => result.compile_output) ? JSON.stringify(deailedResults.map((result: { compile_output: string }) => result.compile_output)) : null,
            status: allPassed ? "APPROVED" : "WRONG ANSWER",
            time: JSON.stringify(deailedResults.map((result: { time: number }) => result.time)),
            memory: JSON.stringify(deailedResults.map((result: { memory: number }) => result.memory)),
        }

        const [submission] = await db.insert(Submission).values(newSubmission).returning();

        if(allPassed) {
            await db.insert(ProblemSolved).values({
                userId: userId,
                problemId: problem_id,
                submissionId: submission.id
            })
            .onConflictDoUpdate({
                target: [ProblemSolved.userId, ProblemSolved.problemId],
                set: {
                    submissionId: submission.id,
                    updatedAt: new Date()
                }
            })
        }

        const testCaseResults = deailedResults.map((result: {
            testCase: string,
            passed: boolean,
            stdout: string,
            expected: string,
            stderr: string,
            compileOutput: string,
            status: string,
            time: string,
            memory: string,
        }) => ({
            submissionId: submission.id,
            testCase: result.testCase,
            passed: result.passed,
            stdout: result.stdout,
            expected: result.expected,
            stderr: result.stderr,
            compileOutput: result.compileOutput,
            status: result.status,
            time: result.time,
            memory: result.memory,

        }))

        await db.insert(TestCaseResult).values(testCaseResults);

        const submissionWithTestCase = await db.select().from(Submission).where(eq(Submission.id, submission.id)).limit(1)

        // retutn response
        return res.status(200).json(
            new ApiResponse(200, true, "Code executed successfully", submissionWithTestCase[0])
        );

    } catch (error) {
        console.error('Error executing code:', error);
        throw new ApiError(500, "Internal server error while executing code");
    }
})