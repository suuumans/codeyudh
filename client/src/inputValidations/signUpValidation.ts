
import { z } from "zod";

export type SignUpSchemaType = z.infer<typeof signUpSchema>;

export const signUpSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long").max(50),
    username: z.string().min(3, "Username must be at least 3 characters long").max(50),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters long").max(50),
});