import type { Request, Response } from "express";
import { db } from "../db/db.ts";
import { Contest } from "../db/schema/contest.schema.ts";
import { ContestParticipant } from "../db/schema/contestParticipant.schema.ts";
import { User } from "../db/schema/user.schema.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";
import { eq, desc } from "drizzle-orm";

// Get all contests
export const getAllContests = asyncHandler(async (req: Request, res: Response) => {
  const contests = await db.select().from(Contest);
  return res.status(200).json(
    new ApiResponse(200, true, "Contests fetched successfully", contests)
  );
});

// Get contest by id
export const getContestById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Contest id is required");
  const contest = await db.select().from(Contest).where(eq(Contest.id, id));
  if (!contest || contest.length === 0) {
    throw new ApiError(404, "Contest not found");
  }
  return res.status(200).json(
    new ApiResponse(200, true, "Contest fetched successfully", contest[0])
  );
});

// Create contest
export const createContest = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, startTime, duration, difficulty, participants, problems, winners } = req.body;

  if (!title || !startTime || !duration || !difficulty) {
    throw new ApiError(400, "Missing required fields: title, startTime, duration, difficulty");
  }
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request - user id not found");
  }

  try{
      // Convert startTime to timestamp with timezone
      const startTimeDate = new Date(startTime);
        
        const newContest = await db.insert(Contest).values({
            title,
            description,
            startTime: startTimeDate,
            duration,
            difficulty: difficulty.toUpperCase(),
            problems: JSON.stringify(problems), // Your schema stores this as JSON
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();
        
        return res.status(201).json({
            success: true,
            data: newContest[0]
        });
    } catch (error) {
        console.error("Error creating contest:", error);
        throw new ApiError(500, "Error creating contest");
    }
});

// Update contest
export const updateContest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Contest id is required");
  const { title, description, startTime, duration, difficulty, participants, problems, winners } = req.body;
  const contest = await db.select().from(Contest).where(eq(Contest.id, id));
  if (!contest || contest.length === 0) {
    throw new ApiError(404, "Contest not found");
  }
  const updatedContest = await db.update(Contest).set({
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(startTime !== undefined && { startTime: new Date(startTime) }),
    ...(duration !== undefined && { duration }),
    ...(difficulty !== undefined && { difficulty }),
    ...(participants !== undefined && { participants }),
    ...(problems !== undefined && { problems }),
    ...(winners !== undefined && { winners }),
    updatedAt: new Date(),
  }).where(eq(Contest.id, id)).returning();
  return res.status(200).json(
    new ApiResponse(200, true, "Contest updated successfully", updatedContest[0])
  );
});

// Delete contest
export const deleteContest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Contest id is required");
  const contest = await db.select().from(Contest).where(eq(Contest.id, id));
  if (!contest || contest.length === 0) {
    throw new ApiError(404, "Contest not found");
  }
  await db.delete(Contest).where(eq(Contest.id, id));
  return res.status(200).json(
    new ApiResponse(200, true, "Contest deleted successfully")
  );
});

// Get contests grouped by status (upcoming, active, past)
export const getContestsGroupedByStatus = asyncHandler(async (_req: Request, res: Response) => {
  const all = await db.select().from(Contest);
  const now = new Date();
  const upcoming = all.filter(c => new Date(c.startTime) > now);
  const active = all.filter(c => new Date(c.startTime) <= now && (new Date(c.startTime).getTime() + c.duration * 60000) > now.getTime());
  const past = all.filter(c => (new Date(c.startTime).getTime() + c.duration * 60000) <= now.getTime());
  return res.status(200).json(
    new ApiResponse(200, true, "Contests grouped by status", { upcoming, active, past })
  );
});

// Get leaderboard for a contest (top 10)
export const getContestLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { contestId } = req.params;
  if (!contestId) throw new ApiError(400, "Contest id is required");
  // Join with user for name
  const leaderboard = await db
    .select({
      name: User.name,
      score: ContestParticipant.score,
      rank: ContestParticipant.rank,
    })
    .from(ContestParticipant)
    .innerJoin(User, eq(ContestParticipant.userId, User.id))
    .where(eq(ContestParticipant.contestId, contestId))
    .orderBy(desc(ContestParticipant.score), ContestParticipant.submissionTime)
    .limit(10);
  return res.status(200).json(leaderboard);
});
