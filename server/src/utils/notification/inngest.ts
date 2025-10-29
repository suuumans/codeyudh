import { EventSchemas, Inngest } from "inngest";
import { notificationEventSchemas } from "./notification.events";
import type { NotificationEvents } from "./notification.events";

// Re-export the event types so they can be used by the Inngest client.
export type Events = NotificationEvents;

// Create a client to send and receive events.
export const inngest = new Inngest({
    id: "codeyudh",

    // The event key is used to send events from your application to Inngest.
    // It's a secret and should be stored in your environment variables.
    eventKey: process.env.INNGEST_EVENT_KEY,

    // The `fromZod` helper connects our schemas to the client.
    // This enables automatic runtime validation of all incoming events.
    schemas: new EventSchemas().fromZod(notificationEventSchemas),
});