
import jwt from "jsonwebtoken";
import type { Request, NextFunction } from "express";
import { ApiError } from "../utils/apiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { User } from "../db/schema/user.schema.ts";
import { db } from "../db/db.ts";
import { eq, and} from "drizzle-orm";

export const verifyJWT = asyncHandler(async (req: Request, _, next: NextFunction) => {
    try {
        // get token from cookies ( or headers )
        const token = req.cookies?.accessToken ?? req.headers?.authorization?.replace("Bearer ", "")
        if(!token) {
            throw new ApiError(401, "Unauthorized request: No token provided")
        }

        // verify token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!)
        if (!decodedToken) {
            throw new ApiError(401, "Invalid token type")
        }

        // find the user based on decoded token's id
        const user = await db.select().from(User).where(eq(User.id, (decodedToken as any).user.id)).limit(1)
        if (!user || user.length === 0) {
            throw new ApiError(401, "Unauthorized request: User not found")
        }

        req.user = user[0]
        next()
    } catch (error) {
        // Handle specific JWT errors or general errors
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            throw new ApiError(401, error?.message || "Invalid Access Token");
       }
       throw error;
    }
})

export const isAdmin = asyncHandler(async (req: Request, _, next: NextFunction) => {
    try {
        const userId = req.user?.id
        if(!userId){
            throw new ApiError(401, "Unauthorized request - user (Admin) id not found")
        }

        const user = await db.select().from(User).where(and(
            eq(User.id, userId),
            eq(User.role, "ADMIN")
        )).limit(1)

        if(!user || user.length === 0){
            throw new ApiError(401, "Unauthorized request - Admin role required!.")
        }

        next()
    } catch (error) {
        console.error("Error checking admin role:", error);
        throw new ApiError(500, "Internal server error while checking admin role");
    }
})