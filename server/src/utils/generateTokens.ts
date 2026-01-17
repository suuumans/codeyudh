
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";


export const generateAuthTokens = async (user: {
    id: string;
    email: string;
    username: string;
    isEmailVerified: boolean;
    role: "ADMIN" | "USER";
}) => {
    const payload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
    };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: "1d",
    });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: "7d",
    });
    return { accessToken, refreshToken };
}

export async function generateVerificationToken(): Promise<{
    unhashedToken: string;
    hashedToken: string;
    tokenExpiry: Date;
}> {
    const unhashedToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(unhashedToken).digest("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return { unhashedToken, hashedToken, tokenExpiry };
}