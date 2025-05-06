
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";


export const generateAuthTokens = async (user: { id: string, email: string, username: string }) => {
    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: "1d",
    });
    const refreshToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: "7d",
    });
    return { accessToken, refreshToken };
}

export async function generateVerificationToken(): Promise<{
    unhashedToken: string;
    hashedToken: string;
    tokenExpiry: Date;
}> {
    const  unhashedToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(unhashedToken).digest("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return { unhashedToken, hashedToken, tokenExpiry };
}