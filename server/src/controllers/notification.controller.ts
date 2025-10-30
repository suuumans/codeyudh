import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/apiError.ts";
import { db } from "../db/db.ts";
import { and, eq, desc, inArray } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { Notification } from "../db/schema/notification.schema.ts";

/**
 * @description Get all notifications for the logged-in user
 * @route GET /api/v1/notifications
 * @access Private
 */
export const getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const notifications = await db.select()
        .from(Notification)
        .where(eq(Notification.userId, userId))
        .orderBy(desc(Notification.createdAt))
        .limit(50); // Add pagination later if needed

    return res.status(200).json(
        new ApiResponse(200, true, "Notifications fetched successfully", notifications)
    );
});

/**
 * @description Mark multiple notifications as read
 * @route POST /api/v1/notifications/mark-read
 * @body { ids?: string[] } - Optional array of notification IDs to mark as read
 * @access Private - Requires authentication
 */
export const markNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, "Unauthorized - User not authenticated");
  }
  
  let result;
  
  // If specific IDs are provided, mark only those as read
  if (ids && ids.length > 0) {
    result = await db.update(Notification)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        and(
          eq(Notification.userId, userId),
          inArray(Notification.id, ids)
        )
      )
      .returning();
  } else {
    // Otherwise mark all notifications as read for this user
    result = await db.update(Notification)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        eq(Notification.userId, userId)
      )
      .returning();
  }
  
  return res.status(200).json(
    new ApiResponse(200, true, "Notifications marked as read", { count: result.length })
  );
});
