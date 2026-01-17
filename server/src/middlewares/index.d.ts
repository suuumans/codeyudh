
// This file uses declaration merging to add a custom 'user' property to the Express Request object.
// This allows us to have type safety for the user object that we attach in our authentication middleware.

declare namespace Express {
    export interface Request {
        user?: {
            id: string;
            userId: string;
            email: string;
            username: string;
            isEmailVerified: boolean;
            role: "ADMIN" | "USER";
        }
    }
}
