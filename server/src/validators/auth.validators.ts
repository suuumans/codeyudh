
import { z } from "zod";

export const registerUserSchema = z.object({
    name: z.string().min(3).max(50),
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(50),
});

export const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(50),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const resendVerificationEmailSchema = z.object({
    email: z.string().email(),
});
