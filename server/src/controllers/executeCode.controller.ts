
// import type { Request, Response } from "express";
// import { db } from "../db/db.ts";
// import { eq } from "drizzle-orm";
// import { asyncHandler } from "../utils/asyncHandler.ts";
// import { ApiResponse } from "../utils/apiResponse.ts";
// import { ApiError } from "../utils/apiError.ts";
// import { getLanguageNmae, pollBatchResults, submitBatch } from "../utils/judge0.ts";
// import { Submission } from "../db/schema/submission.schema.ts";
// import { ProblemSolved } from "../db/schema/problemSolved.schema.ts";
// import { TestCaseResult } from "../db/schema/testCaseResult.schema.ts";


// type NewSubmission = typeof Submission.$inferInsert;


// /**
//  * @description Execute code
//  * @body { source_code: string, language_id: number, stdin: string[], expected_outputs: string[], problem_id: number }
//  * @route POST /api/v1/execute-code
//  * @access Private only logged in user can access
//  */
// export const executeCode = asyncHandler(async(req: Request, res: Response) => {
//     try {
//         const { source_code, language_id, stdin, expected_outputs, problem_id} = req.body;
//         const userId = req.user?.id;

//         if(!userId){
//             throw new ApiError(401, "Unauthorized request - user id not found")
//         }

//         // 1. validate test cases
//         if (!Array.isArray(stdin) || stdin.length === 0 || !Array.isArray(expected_outputs) || expected_outputs.length !== stdin.length) {
//             return res.status(400).json(
//                 new ApiResponse(400, false, "Invalid stdin or expected_outputs")
//             );
//         }

//         // 2. prepare each test cases for judge0 batch submission
//         const submissions = stdin.map((input) => ({
//             source_code,
//             language_id,
//             stdin: input,
//         }))

//         // 3. submit batch to judge0
//         // const submitResponse = await submitBatch(submissions);
//         // if (submitResponse.status !== 200) {
//         //     throw new ApiError(submitResponse.status, submitResponse.message);
//         // }

//         // Replace lines 47-49 with this more robust error checking
//         // 3. submit batch to judge0
//         const submitResponse = await submitBatch(submissions);

//         // Check if submitResponse exists and has the expected structure
//         if (!submitResponse || !Array.isArray(submitResponse) || submitResponse.length === 0) {
//             console.log("Judge0 submission response:", JSON.stringify(submitResponse, null, 2));
//             throw new ApiError(500, "Failed to submit code to execution service: Invalid response format");
//         }

//         // Extract tokens from the response
//         const tokens = submitResponse.map((result: { token: string }) => result.token);
//         if (tokens.length === 0) {
//             throw new ApiError(500, "Failed to submit code to execution service: No tokens returned");
//         }

//         // 4. poll judge0 for results of all submitted test cases
//         const results = await pollBatchResults({ tokens });

//         console.log("Results: ---------->>>");
//         console.log(results);

//         // 5. validate each test case result
//         for (let i = 0; i < results.length; i++) {
//             if (results[i].status.id === 3) {
//                 throw new ApiError(400, `Compilation Error: Testcase ${i + 1} failed`);
//             }
//         }

//         // analyse test case results
//         let allPassed = true;
//         const deailedResults = results.map(
//             (
//                 result: { 
//                     stdout: string,
//                     expected_output: string,
//                     stderr: string,
//                     compile_output: string,
//                     status: string,
//                     time: number,
//                     memory: number,
//                     created_at: Date,
//                     updated_at: Date
//                 },
//                 index: number
//             ) => {
//             const stdout = result.stdout?.trim();
//             const expected_output = expected_outputs[index]?.trim();
//             const passed = stdout === expected_output;

//             if (!passed) allPassed = false;

//             return {
//                 testCase: index + 1,
//                 passed,
//                 stdout,
//                 expected: expected_output,
//                 stderr: result.stderr ?? null,
//                 compileOutput: result.compile_output,
//                 status: result.status,
//                 time: result.time ? `${result.time} ms` : undefined,
//                 memory: result.memory ? `${result.memory} KB` : undefined,
//                 createdAt: result.created_at,
//                 updatedAt: result.updated_at
//             }
            
//             // console.log(`Testcase ${index + 1}: ${passed ? "Passed" : "Failed"}`);
//             // console.log(`Input for Testcase ${index + 1}: ${stdin[index]}`);
//             // console.log(`Expected Output for Testcase ${index + 1}: ${expected_output}`);
//             // console.log(`Actual Output for Testcase ${index + 1}: ${stdout}`);

//             // console.log(`Matched: ${passed}`)
//             // console.log("--------------------------------------------------");

//         })

//         console.log(deailedResults);

//         // 6. save submission summery to database
//         const newSubmission: NewSubmission = {
//             userId,
//             problemId: problem_id,
//             sourceCode: source_code,
//             language: getLanguageNmae(language_id),
//             stdin: stdin.join("\n"),
//             stdout: JSON.stringify(deailedResults.map((result: { stdout: string }) => result.stdout)),
//             stderr: deailedResults.some((result: { stderr: string }) => result.stderr) ? JSON.stringify(deailedResults.map((result: { stderr: string }) => result.stderr)) : null,
//             compileOutput: deailedResults.some((result: { compile_output: string }) => result.compile_output) ? JSON.stringify(deailedResults.map((result: { compile_output: string }) => result.compile_output)) : null,
//             status: allPassed ? "APPROVED" : "WRONG ANSWER",
//             time: JSON.stringify(deailedResults.map((result: { time: number }) => result.time)),
//             memory: JSON.stringify(deailedResults.map((result: { memory: number }) => result.memory)),
//         }

//         const [submission] = await db.insert(Submission).values(newSubmission).returning();

//         if(allPassed) {
//             await db.insert(ProblemSolved).values({
//                 userId: userId,
//                 problemId: problem_id,
//                 submissionId: submission.id
//             })
//             .onConflictDoUpdate({
//                 target: [ProblemSolved.userId, ProblemSolved.problemId],
//                 set: {
//                     submissionId: submission.id,
//                     updatedAt: new Date()
//                 }
//             })
//         }

//         const testCaseResults = deailedResults.map((result: {
//             testCase: string,
//             passed: boolean,
//             stdout: string,
//             expected: string,
//             stderr: string,
//             compileOutput: string,
//             status: string,
//             time: string,
//             memory: string,
//         }) => ({
//             submissionId: submission.id,
//             testCase: result.testCase,
//             passed: result.passed,
//             stdout: result.stdout,
//             expected: result.expected,
//             stderr: result.stderr,
//             compileOutput: result.compileOutput,
//             status: result.status,
//             time: result.time,
//             memory: result.memory,

//         }))

//         await db.insert(TestCaseResult).values(testCaseResults);

//         const submissionWithTestCase = await db.select().from(Submission).where(eq(Submission.id, submission.id)).limit(1)

//         // retutn response
//         return res.status(200).json(
//             new ApiResponse(200, true, "Code executed successfully", submissionWithTestCase[0])
//         );

//     } catch (error) {
//         console.error('Error executing code:', error);
//         throw new ApiError(500, "Internal server error while executing code");
//     }
// })



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
import { inngest } from "../utils/notification/inngest.ts";

// Define proper types for better type safety
type NewSubmission = typeof Submission.$inferInsert;
type TestCaseResultType = typeof TestCaseResult.$inferInsert;

interface ExecutionResult {
  testCase: number;
  passed: boolean;
  stdout: string;
  expected: string;
  stderr: string | null;
  compileOutput: string | null;
  status: string;
  time: string | undefined;
  memory: string | undefined;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @description Execute code and validate against test cases
 * @params problem_id: string
 * @body { source_code: string, language_id: number, stdin: string[], expected_outputs: string[] }
 * @route POST /api/v1/execute-code
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /execute-code/{problem_id}:
 *   post:
 *     tags:
 *       - Code Execution
 *     summary: Execute code and get results
 *     description: Submits user's code for a specific problem, runs it against all test cases, and returns the execution results.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: problem_id
 *         in: path
 *         required: true
 *         description: The ID of the problem to execute the code against.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - source_code
 *               - language_id
 *               - stdin
 *               - expected_outputs
 *             properties:
 *               source_code:
 *                 type: string
 *                 description: The user's code to be executed.
 *                 example: "function solve() { return 42; }"
 *               language_id:
 *                 type: number
 *                 description: The ID of the language from Judge0 API.
 *                 example: 93
 *               stdin:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: An array of inputs, one for each test case.
 *               expected_outputs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: An array of expected outputs, corresponding to each stdin.
 *     responses:
 *       '200':
 *         description: Code executed successfully. Returns the submission summary and results.
 *       '400':
 *         description: Bad Request - Invalid input, such as missing fields or compilation errors.
 *       '401':
 *         description: Unauthorized - User is not authenticated.
 *       '500':
 *         description: Internal Server Error - Could not process the execution request.
 */
export const executeCode = asyncHandler(async(req: Request, res: Response) => {
    const { source_code, language_id, stdin, expected_outputs } = req.body;
    const { problem_id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized request - user id not found");
    }

    if (!problem_id || typeof problem_id !== 'string') {
        throw new ApiError(400, "Valid problem ID is required");
    }

    console.log('Request body:', req.body);
    console.log('Problem ID:', problem_id);


    // 1. Validate test cases
    if (!Array.isArray(stdin) || stdin.length === 0 || 
        !Array.isArray(expected_outputs) || expected_outputs.length !== stdin.length) {
        throw new ApiError(400, "Invalid stdin or expected_outputs");
    }

    try {
        // 2. Prepare each test case for judge0 batch submission
        const submissions = stdin.map((input) => ({
            source_code,
            language_id,
            stdin: input,
        }));

        // 3. Submit batch to judge0
        const submitResponse = await submitBatch(submissions);

        // Validate submission response
        if (!submitResponse || !Array.isArray(submitResponse) || submitResponse.length === 0) {
            throw new ApiError(500, "Failed to submit code to execution service: Invalid response format");
        }

        // Extract tokens from the response
        const tokens = submitResponse.map((result: { token: string }) => result.token);
        if (tokens.length === 0) {
            throw new ApiError(500, "Failed to submit code to execution service: No tokens returned");
        }

        // 4. Poll judge0 for results of all submitted test cases
        const results = await pollBatchResults({ tokens });
        console.log("Results: ---------->>>");
        console.log(results);

        // 5. Validate each test case result for compilation errors first
        // for (let i = 0; i < results.length; i++) {
        //     if (results[i].status.id === 3) {
        //         throw new ApiError(400, `Compilation Error: Testcase ${i + 1} failed`);
        //     }
        // }

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result) {
                console.error(`No result data for testcase ${i + 1}`);
                continue;
            }

            // Check for compilation errors (status id 6 is compilation error in Judge0)
            if (result.status && result.status.id === 6) {
                const compileOutput = result.compile_output || 'No compile output available';
                console.error(`Compilation error details: ${compileOutput}`);
                throw new ApiError(400, `Compilation Error: Testcase ${i + 1} failed - ${compileOutput}`);
            }
        }


        // 6. Analyze test case results
        let allPassed = true;
        const detailedResults: ExecutionResult[] = results.map(
            (result: any, index: number) => {
                const stdout = result.stdout?.trim() || "";
                const expected_output = expected_outputs[index]?.trim() || "";
                const passed = stdout === expected_output;

                if (!passed) allPassed = false;

                return {
                    testCase: index + 1,
                    passed,
                    stdout,
                    expected: expected_output,
                    stderr: result.stderr || null,
                    compileOutput: result.compile_output || null,
                    status: result.status?.description || "Unknown",
                    time: (typeof result.time === "number" ? `${result.time} ms` : "0 ms"),
                    memory: (typeof result.memory === "number" ? `${result.memory} KB` : "0 KB"),
                    createdAt: result.created_at,
                    updatedAt: result.updated_at
                };
            }
        );

        // 7. Prepare data for database insertion
        const newSubmission: NewSubmission = {
            userId,
            problemId: problem_id,
            sourceCode: source_code,
            language: getLanguageNmae(language_id),
            stdin: stdin.join("\n"),
            stdout: JSON.stringify(detailedResults.map(result => result.stdout)),
            stderr: detailedResults.some(result => result.stderr) 
                ? JSON.stringify(detailedResults.map(result => result.stderr)) 
                : null,
            compileOutput: detailedResults.some(result => result.compileOutput) 
                ? JSON.stringify(detailedResults.map(result => result.compileOutput)) 
                : null,
            status: allPassed ? "APPROVED" : "WRONG ANSWER",
            time: JSON.stringify(detailedResults.map(result => result.time)),
            memory: JSON.stringify(detailedResults.map(result => result.memory)),
        };

        // 8. Use a transaction for database operations to ensure data integrity
        const submission = await db.transaction(async (tx) => {
            // Insert submission
            const [submissionResult] = await tx.insert(Submission)
                .values(newSubmission)
                .returning();
            
            // If all test cases passed, update ProblemSolved table
            if (allPassed) {
                await tx.insert(ProblemSolved).values({
                    userId: userId,
                    problemId: problem_id,
                    submissionId: submissionResult.id
                })
                .onConflictDoUpdate({
                    target: [ProblemSolved.userId, ProblemSolved.problemId],
                    set: {
                        submissionId: submissionResult.id,
                        updatedAt: new Date()
                    }
                });
            }
            
            // Prepare and insert test case results
            const testCaseResults = detailedResults.map((result: ExecutionResult) => ({
                submissionId: submissionResult.id,
                testCase: result.testCase, // Already a number, no need to parse
                passed: result.passed,
                stdout: result.stdout,
                expected: result.expected,
                stderr: result.stderr || '', // Ensure string, not null
                compileOutput: result.compileOutput || '', // Ensure string, not null
                status: result.status,
                time: result.time || "0 ms", // Ensure string, not undefined
                memory: result.memory || "0 KB", // Ensure string, not undefined
                createdAt: new Date().toISOString(), // Add required createdAt
                updatedAt: new Date().toISOString()
            }));

            
            await tx.insert(TestCaseResult).values(testCaseResults);
            
            return submissionResult;
        });

        // 9. Fetch complete submission with test cases for response
        const [submissionWithTestCase] = await db.select()
            .from(Submission)
            .where(eq(Submission.id, submission.id))
            .limit(1);


        await inngest.send({
            name:"submission.accepted",
            data: {
                userId: submissionWithTestCase.userId,
                problemId: submissionWithTestCase.problemId,
                submissionId: submissionWithTestCase.id,
                linkUrl: `/problems/${submissionWithTestCase.problemId}`,
                problemTitle: "Problem Title", // You might want to fetch the actual problem title here
            }
        })
        // 10. Return response
        return res.status(200).json(
            new ApiResponse(200, true, "Code executed successfully", submissionWithTestCase)
        );

    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error instanceof ApiError) {
            throw error;
        }
        
        console.error('Error executing code:', error);
        throw new ApiError(500, "Internal server error while executing code");
    }
});
