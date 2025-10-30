
import { inngest } from "./inngest";
import { createNotification } from "./notification.service";
import { templates } from "./notification.templates";

const paymentSucceeded = inngest.createFunction(
    { id: "payment-succeeded-notification" },
    { event: "payment.succeeded" },
    async ({ event }) => {
        const { userId, playlistId, playlistName, linkUrl } = event.data;

        // 1. Get the message from our template store
        const { message } = templates.paymentSuccess({ playlistName });

        // 2. Use the notification service to create the record
        await createNotification({
            userId,
            type: "PAYMENT_SUCCESS",
            message,
            linkUrl,
            metadata: { playlistId },
        });
    }
);

const submissionAccepted = inngest.createFunction(
    { id: "submission-accepted-notification" },
    { event: "submission.accepted" },
    async ({ event }) => {
        const { userId, problemId, problemTitle, submissionId, linkUrl } = event.data;

        // 1. Get the message from our template store
        const { message } = templates.submissionAccepted({ problemTitle });

        // 2. Use the notification service to create the record
        await createNotification({
            userId,
            type: "SUBMISSION_ACCEPTED",
            message,
            linkUrl,
            metadata: { problemId, submissionId },
        });
    }
);


export const functions = [paymentSucceeded, submissionAccepted];
