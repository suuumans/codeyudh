import { z } from "zod";

// Define Zod schemas for the data payload of each event.
export const paymentSucceededData = z.object({
    userId: z.string().uuid(),
    playlistId: z.string().uuid(),
    playlistName: z.string(),
    linkUrl: z.string().startsWith("/"),
});

export const submissionAcceptedData = z.object({
    userId: z.string().uuid(),
    problemId: z.string().uuid(),
    problemTitle: z.string(),
    submissionId: z.string().uuid(),
    linkUrl: z.string().startsWith("/"),
});

// This is the object we will pass to the Inngest client.
export const notificationEventSchemas = {
  "payment.succeeded": { data: paymentSucceededData },
  "submission.accepted": { data: submissionAcceptedData },

  // "user.mention": { data: userMentionData },
};

// This creates a TypeScript type that maps event names to their data shapes.
// It's useful for type safety when sending events.
type EventData<T> = T extends { data: z.ZodTypeAny } ? z.infer<T["data"]> : never;

export type NotificationEvents = {
  [K in keyof typeof notificationEventSchemas]: {
    data: EventData<typeof notificationEventSchemas[K]>
  }
};