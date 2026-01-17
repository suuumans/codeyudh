
// import jwt from "jsonwebtoken";
// import type { Request, NextFunction } from "express";
// import { ApiError } from "../utils/apiError.ts";
// import { asyncHandler } from "../utils/asyncHandler.ts";

// export const verifyJWT = asyncHandler(async (req: Request, _, next: NextFunction) => {
//     try {
//         // get token from cookies ( or headers )
//         const token =
//             req.cookies?.accessToken ??
//             req.headers?.authorization?.replace("Bearer ", "");
//         if (!token) {
//         throw new ApiError(401, "Unauthorized request: No token provided");
//         }

//         // verify token
//         const decodedPayload = jwt.verify(
//             token,
//             process.env.ACCESS_TOKEN_SECRET!
//         );

//         // Attach the decoded payload to the request object
//         // The payload now contains id, email, username, isEmailVerified, and role
//         req.user = decodedPayload as any;

//         next()
//     } catch (error) {
//         // Handle specific JWT errors or general errors
//         if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
//             throw new ApiError(401, error?.message || "Invalid Access Token");
//        }
//        throw error;
//     }
// })

// export const isAdmin = asyncHandler(async (req: Request, _, next: NextFunction) => {
//   // The user's role is available from the JWT payload attached by `verifyJWT`.
//   // No need for an extra database call.
//   if (req.user?.role !== "ADMIN") {
//     throw new ApiError(403, "Forbidden: Admin role required.");
//   }
//   next();
// });


import jwt from "jsonwebtoken";
import type { Request, NextFunction } from "express";
import { ApiError } from "../utils/apiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";

export const verifyJWT = asyncHandler(async (req: Request, _, next: NextFunction) => {
    try {
        // get token from cookies ( or headers )
        const token =
            req.cookies?.accessToken ??
            req.headers?.authorization?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "Unauthorized request: No token provided");
        }

        // verify token
        const decodedPayload = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET!
        ) as any;

        // ✅ FIX: Map userId to id for backwards compatibility
        // The JWT payload has 'userId', but controllers expect 'id' so for now i am keeping both
        req.user = {
            id: decodedPayload.userId,  // Map userId -> id
            userId: decodedPayload.userId, // Keep userId for new code
            email: decodedPayload.email,
            username: decodedPayload.username,
            isEmailVerified: decodedPayload.isEmailVerified,
            role: decodedPayload.role
        };

        console.log("🔐 User attached to request:", req.user.id);

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
    // The user's role is available from the JWT payload attached by `verifyJWT`.
    // No need for an extra database call.
    if (req.user?.role !== "ADMIN") {
        throw new ApiError(403, "Forbidden: Admin role required.");
    }
    next();
});