import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/apiError.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { valkey } from "../utils/valkey.ts";
import { db } from "../db/db.ts";
import { Problem } from "../db/schema/problem.schema.ts";
import { eq } from "drizzle-orm";
import { getAIChatResponse } from "../utils/ai/ai.ts";
import type { ChatMessage } from "../utils/ai/ai.ts";

const MAX_HISTORY_LENGTH = 20; // Keep the last 20 messages (10 user, 10 AI)

/**
 * @description Chat with AI assistant for help on a problem
 * @body { problemId: string, userCode: string, userQuestion: string }
 * @route POST /api/v1/ai/chat
 * @access Private (logged-in users only)
 */
export const chatWithAI = asyncHandler(async (req: Request, res: Response) => {
    const { problemId, userCode, userQuestion } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized request. Please log in.");
    }

    if (!problemId || !userCode || !userQuestion) {
        throw new ApiError(400, "problemId, userCode, and userQuestion are required.");
    }

    // Rate limiting using Valkey for AI requests
    const rateKey = `rate:ai:${userId}`;
    const RATE_LIMIT = Number(process.env.AI_RATE_LIMIT || 10);
    try {
    const count = await valkey.incr(rateKey);
    if (count === 1) await valkey.expire(rateKey, 3600);
    if (count > RATE_LIMIT) throw new ApiError(429, 'Rate limit exceeded for AI requests.');
    } catch (err) {
        console.warn('Rate limiter failure (valkey):', err);
    }

    // 1. Fetch problem details from the database
    const [problem] = await db.select().from(Problem).where(eq(Problem.id, problemId)).limit(1);
    if (!problem) {
        throw new ApiError(404, "Problem not found.");
    }

    // 2. Fetch conversation history from Valkey
    const historyKey = `chat_history:${userId}:${problemId}`;
    const rawHistory = await valkey.lrange(historyKey, 0, -1);
    const history = rawHistory.map(item => JSON.parse(item)); // chronological order
    // const history: ChatMessage[] = rawHistory.map(item => JSON.parse(item)).reverse(); // reverse to get chronological order

    const systemInstruction = `You are a world-class software engineering assistant, specializing in helping programmers solve coding challenges. 
        Your tone should be encouraging and educational.

        A user is working on the following problem:
        --- PROBLEM CONTEXT ---
        Title: ${problem.title}
        Description: ${problem.description}
        --- END PROBLEM CONTEXT ---

        Here is the code the user has written so far:
        --- USER's CODE ---
        ${userCode}
        --- END USER's CODE ---

        Analyze their code based on the problem description and their question. Provide clear, concise, and helpful guidance.
        - If their code has bugs, point them out and explain the fix.
        - If their approach is incorrect, gently guide them toward a better one.
        - Provide corrected or improved code snippets where appropriate using markdown.
    `;

    // 3. Call the centralized AI service
    let aiResponse: string;
    try {
        aiResponse = await getAIChatResponse({ systemInstruction, history, userQuestion });
    } catch (error: any) {
        throw new ApiError(503, error.message || "The AI service is currently unavailable.");
    }

    // 4. Save the new exchange to Valkey history
    const userMessageToStore = JSON.stringify({ role: "user", content: userQuestion });
    const aiMessageToStore = JSON.stringify({ role: "assistant", content: aiResponse });

    // Add the new message to the history
    try {
        await valkey.rpush(historyKey, userMessageToStore, aiMessageToStore);
        await valkey.ltrim(historyKey, -MAX_HISTORY_LENGTH, -1); // Keep only the last N messages
        await valkey.expire(historyKey, 3600 * 24); // Set/reset expiry to 24 hours
    
    } catch (error) {
        console.error("Error saving chat history:", error);
        throw new ApiError(500, "Failed to save chat history.");
    }
    // 5. Send the response to the client
    res.status(200).json(new ApiResponse(200, true, "AI response received.", { answer: aiResponse }));
});