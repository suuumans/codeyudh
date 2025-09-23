import type { Request, Response } from "express"
import { ApiResponse } from "../utils/apiResponse"
import { ApiError } from "../utils/apiError"
import { db } from "../db/db.ts"
import { User } from "../db/schema/user.schema"
import { eq, inArray } from "drizzle-orm"
import jwt from "jsonwebtoken"
import type { JwtPayload } from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler"
import { generateAuthTokens, generateVerificationToken } from "../utils/generateTokens.ts"
import { emailVerificationGenContent, forgotPasswordGenContent, sendMail } from "../utils/mail.ts"
import { UserProblems } from "../db/schema/userProblem.schema.ts"
import { Problem } from "../db/schema/problem.schema.ts"



/**
 * @description Register a new user
 * @body { name: string, username: string, email: string, password: string } 
 * @route POST /api/v1/auth/register
 * @access Public anyone can access register route
 */

/** 
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Creates a new user account, hashes the password, and sends a verification email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: MySecurePassword123
 *     responses:
 *       '201':
 *         description: User registered successfully. A verification email has been sent.
 *       '400':
 *         description: Bad Request - Missing fields or user with this email already exists.
 *       '500':
 *         description: Internal Server Error.
 */
export const registerUser = asyncHandler( async (req: Request, res: Response) => {
    const { name, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await db.select().from(User).where(eq(User.email, email)).limit(1);
    if (existingUser.length > 0) {
        throw new ApiError(409, "User with this email already exists");
    }

    // hash password
    const hashedPassword = await Bun.password.hash(password);

    const newUserResult = await db.insert(User).values({
        name,
        username,
        email,
        password: hashedPassword,
    }).returning();

    if (!newUserResult || newUserResult.length === 0) {
        throw new ApiError(500, "User registration failed during database insertion.");
    }

    const newUser = newUserResult[0];

    // generate verification token
    const { unhashedToken, hashedToken, tokenExpiry } = await generateVerificationToken();

    // update verification token in data base
    await db.update(User).set({
        verificationToken: hashedToken,
        verificationTokenExpiry: tokenExpiry,
    }).where(eq(User.id, newUser.id));

    // create verification url for email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${unhashedToken}`;

    // generate email content
    const mailGenContent = emailVerificationGenContent(newUser.name, verificationUrl);

    // send verification email
    await sendMail({
        email: newUser.email,
        subject: "Verify your email address",
        mailgenContent: mailGenContent
    });

    return res.status(201).json(
        new ApiResponse(201,
            true,
            "User registered successfully. Please check your email to verify your account.",
            {
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    username: newUser.username,
                    email: newUser.email,
                    isEmailVerified: false,
                }
            }
        )
    );
})

/**
 * @description login user
 * @body { email: string, password: string } 
 * @route POST /api/v1/auth/login
 * @access Public anyone can access login route
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     description: Logs in a user and generates access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: MySecurePassword123
 *     responses:
 *       '200':
 *         description: User logged in successfully. Access and refresh tokens returned.
 *       '400':
 *         description: Bad Request - Missing fields or user not found.
 *       '401':
 *         description: Unauthorized - Invalid password or email not verified.
 *       '500':
 *         description: Internal Server Error.
 *   
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // check if user exists with the given email
    const existingUser = await db.select().from(User).where(eq(User.email, email)).limit(1);
    if (existingUser.length === 0) {
        throw new ApiError(404, "User not found with the given email");
    }
    const user = existingUser[0];
    // check if password is correct
    const isPasswordCorrect = await Bun.password.verify(password, user.password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password! Please enter correct password.");
    }

    // check if email is verified
    if (!user.isEmailVerified) {
        throw new ApiError(401, "Email not verified! Please verify your email.");
    }

    // This is a defensive check. With the schema change, this should never be null.
    if (!user.role) {
        throw new ApiError(500, "User role is not set. Please contact support.");
    }

    // generate access & refresh token
    const { accessToken, refreshToken } = await generateAuthTokens(user);

    // store the token in db
    await db.update(User).set({
        refreshToken,
    }).where(eq(User.id, user.id));

    // create cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.BUN_ENV === "production",
    };

    // set cookies
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    // return response
    return res.status(200).json(
        new ApiResponse(200, true, "User logged in successfully", {
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                role: user.role,
            },
        })
    );
})

/**
 * @description logout user
 * @headers { Authorization: Bearer <access_token> }
 * @route POST /api/v1/auth/logout
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout user
 *     description: Logs out a user and clears access and refresh tokens from cookies.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User logged out successfully.
 *       '401':
 *         description: Unauthorized - User not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const logoutUser = asyncHandler(async(req: Request, res: Response) => {
    // get the user id from the request
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }

    try {
        // find and update the user to remove the refresh token
        const user = await db.select().from(User).where(eq(User.id, userId)).limit(1)

        if(!user){
            throw new ApiError(404, "User not found!")
        }

        // create cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.BUN_ENV === "production",
            maxAge: 0
        }

        // clear tokens from the cookie
        res.clearCookie("accessToken", cookieOptions)
        res.clearCookie("refreshToken", cookieOptions)

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "User logged out successfully!")
        )
    } catch (error) {
        console.error("Logout user error: ", error)
        throw new ApiError(500, "Internal server error while logging out user!")
    }
})

/**
 * @description verify user
 * @param {string} token
 * @route POST /api/v1/auth/verify
 * @access Public only logged in user can access
*/

/**
 * @openapi
 * /auth/verify/{token}:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Verify user
 *     description: Verifies a user's email by accepting a verification token.
 *     parameters:
 *       - name: token
 *         in: path
 *         description: The verification token to be accepted.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: User email verified successfully.
 *       '400':
 *         description: Bad Request - Token is required.
 *       '404':
 *         description: Not Found - User not found. Invalid verification token.
 *       '500':
 *         description: Internal Server Error.
 */
export const verifyUser = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params
    if(!token){
        throw new ApiError(400, "Token is required!")
    }

    try {
        // hash the token
        const hashedToken = new Bun.CryptoHasher("sha256").update(token).digest("hex")
        
        // find the user with the given token
        const user = await db.select().from(User).where(eq(User.verificationToken, hashedToken)).limit(1)

        if(!user){
            throw new ApiError(404, "User not found. Invalid verification token!")
        }

        // update user verification status and clear the token
        const updatedUser = await db.update(User).set({
            isEmailVerified: true,
            verificationToken: null,
            verificationTokenExpiry: null,
        }).where(eq(User.id, user[0].id)).returning()

        if(!updatedUser || updatedUser.length === 0){
            throw new ApiError(500, "Failed to verify user email. Please try again later!")
        }

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "User email verified successfully!")
        )
    } catch (error) {
        console.error('Error verifying user:', error);
        throw new ApiError(500, "Internal server error while verifying user");
    }
})

/**
 * @description resend verification email
 * @body {string} email
 * @route POST /api/v1/auth/resend-verification-email
 * @access Public anyone can access
 */

/**
 * @openapi
 * /auth/resend-verification-email:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Resend verification email
 *     description: Resends a verification email to a user's email address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: true
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       '200':
 *         description: Verification email resent successfully.
 *       '400':
 *         description: Bad Request - Email is required.
 *       '404':
 *         description: Not Found - User not found. Invalid email.
 *       '500':
 *         description: Internal Server Error.
 */
export const resendVerificationEmail = asyncHandler(async(req: Request, res: Response) => {
    // get the email from the body
    const { email } = req.body
    if(!email){
        throw new ApiError(400, "Email is required! to resend verification email")
    }
    
    try {
        // find the user with the given email
        const user = await db.select().from(User).where(eq(User.email, email)).limit(1)

        if(!user){
            throw new ApiError(404, "User not found! Invalid email!")
        }

        // check if user email is already verified
        if(user[0].isEmailVerified){
            throw new ApiError(400, "User email is already verified!")
        }

        // generate new verification token
        const { unhashedToken, hashedToken, tokenExpiry } = await generateVerificationToken()

        // update user verification token and expiry
        const updatedUser = await db.update(User).set({
            verificationToken: hashedToken,
            verificationTokenExpiry: tokenExpiry,
        }).where(eq(User.id, user[0].id)).returning()

        if(!updatedUser || updatedUser.length === 0){
            throw new ApiError(500, "Failed to update user verification token. Please try again later!")
        }

        // generate verification url
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${unhashedToken}`
        // generate email content
        const mailGenContent = emailVerificationGenContent(user[0].name, verificationUrl)

        // send verification email
        try {
            await sendMail({
                email: user[0].email,
                subject: "Verify your email address",
                mailGenContent
            });
            return res.status(200).json(
                new ApiResponse(200, true, "Verification email sent successfully" )
            )
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw new ApiError(500, "Internal server error while sending verification email");
        }
    } catch (error) {
        console.error('Error resending verification email:', error);
        throw new ApiError(500, "Internal server error while resending verification email");
    }
})

/**
 * @description refresh access token
 * @cookie {string} get the refreshToken from the cookie
 * @route POST /api/v1/auth/refresh-access-token
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /auth/refresh-access-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh access token
 *     description: Refreshes the access token using a refresh token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Access token refreshed successfully.
 *       '401':
 *         description: Unauthorized - Invalid refresh token.   
 *       '500':
 *         description: Internal Server Error.
 */
export const refreshAccessToken = asyncHandler(async(req: Request, res: Response) => {
    try {
        // get the refreshToken from the cookie
        const incommingRefreshToken = req.cookies.refreshToken
        if(!incommingRefreshToken){
            throw new ApiError(401, "Unauthorized request - refresh token not found!")
        }

        // verify the refresh token using jwt
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload & { id: string }

        // exract the user id from the token
        const userId = decodedToken.id

        if(!userId){
            throw new ApiError(401, "Invalid refresh token - user not found!")
        }
        // find user with this refresh token
        const user = await db.select().from(User).where(eq(User.id, userId)).limit(1)

        if(!user || user.length === 0){
            throw new ApiError(401, "Invalid refresh token - user not found!")
        }

        // validate the stored refresh token agains the provided one to prevent token tampering
        if(!user[0].refreshToken || user[0].refreshToken !== incommingRefreshToken){
            throw new ApiError(401, "refresh token has been revoked!")
        }

        // generate new access & refresh token
        const { accessToken, refreshToken } = await generateAuthTokens(user[0])

        // store the token in db
        await db.update(User).set({
            refreshToken,
            // refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }).where(eq(User.id, user[0].id)).returning()

        // create cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.BUN_ENV === "production"
        }

        //set cookie for access token and refresh token
        res.cookie("accessToken", accessToken, cookieOptions)
        res.cookie("refreshToken", refreshToken, cookieOptions)

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Access token refreshed successfully" )
        )
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw new ApiError(500, "Internal server error while refreshing access token");
    }
})

/**
 * @description forgot password
 * @body {string} email
 * @route POST /api/v1/auth/forgot-password
 * @access Public anyone can access
 */

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Forgot password
 *     description: Sends a password reset email to the user with the provided email address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user.
 *                 format: email
 *     responses:
 *       '200':
 *         description: Password reset email sent successfully.
 *       '400':
 *         description: Bad Request - Email is required.
 *       '404':
 *         description: Not Found - User not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const forgotPassword = asyncHandler(async(req: Request, res: Response) => {
    // get the email from body
    const { email } = req.body

    // check if email is provided
    if(!email){
        throw new ApiError(400, "Email is required!")
    }

    try {
        // find user with this email
        const user = await db.select().from(User).where(eq(User.email, email)).limit(1)

        if(!user || user.length === 0){
            throw new ApiError(404, "User not found! Please enter valid email.")
        }

        // generate new password reset token
        const { unhashedToken, hashedToken, tokenExpiry } = await generateVerificationToken()

        // update verification token in data base
        await db.update(User).set({
            forgetPasswordToken: hashedToken,
            forgetPasswordTokenExpiry: tokenExpiry,
        }).where(eq(User.id, user[0].id)).returning()

        // create reset password url
        const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password?token=${unhashedToken}`

        // generate email content
        const mailGenContent = forgotPasswordGenContent(user[0].name, resetPasswordUrl)

        // send email
        await sendMail({
            email: user[0].email,
            subject: "Password Reset Request",
            mailgenContent: mailGenContent,
        })

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Password reset email sent successfully" )
        )

    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new ApiError(500, "Internal server error while sending password reset email");
    }
})

/**
 * @description reset password
 * @body {string} token
 * @body {string} password
 * @route POST /api/v1/auth/reset-password
 * @access Public anyone can access
 */

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password
 *     description: Resets the password for the user with the provided token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: The password reset token.
 *               password:
 *                 type: string
 *                 description: The new password for the user.
 *     responses:
 *       '200':
 *         description: Password reset successful.
 *       '400':
 *         description: Bad Request - Token and password are required.
 *       '404':
 *         description: Not Found - User not found. Invalid token.
 *       '500':
 *         description: Internal Server Error.
 */
export const resetPassword = asyncHandler(async(req: Request, res: Response) => {
    // get the token and password from body
    const { token, password } = req.body

    // check if token is provided
    if(!token || !password){
        throw new ApiError(400, "Token and password are required!")
    }

    try {
        // hash the recived token to compare with the stored one
        const hashedToken = new Bun.CryptoHasher("sha256").update(token).digest("hex")

        // find user with this token
        const user = await db.select().from(User).where(eq(User.forgetPasswordToken, hashedToken)).limit(1)

        if(!user || user.length === 0){
            throw new ApiError(404, "Invalid or expired password reset token.")
        }

        // hash the password
        const hashedPassword = await Bun.password.hash(password)

        // update user password
        const updatedUser = await db.update(User).set({
            password: hashedPassword,
            forgetPasswordToken: null,
            forgetPasswordTokenExpiry: null,
        }).where(eq(User.id, user[0].id)).returning()

        if(!updatedUser || updatedUser.length === 0){
            throw new ApiError(500, "Failed to reset user password. Please try again later!")
        }

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Password reset successfully" )
        )
    } catch (error) {
        console.error('Error resetting password:', error);
        throw new ApiError(500, "Internal server error while resetting password");
    }
})

/**
 * @description change password
 * @body {string} currentPassword
 * @body {string} newPassword
 * @route POST /api/v1/auth/change-password
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Change password
 *     description: Changes the password for the authenticated user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: The current password for the user.
 *               newPassword:
 *                 type: string
 *                 description: The new password for the user.
 *     responses:
 *       '200':
 *         description: Password changed successfully.
 *       '400':
 *         description: Bad Request - Current password and new password are required.
 *       '401':
 *         description: Unauthorized - Invalid current password.
 *       '404':
 *         description: Not Found - User not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const changePassword = asyncHandler(async(req: Request, res: Response) => {
    // get the current password and new password from body
    const { currentPassword, newPassword } = req.body
    const userId = req.user?.id

    // check if user id is present
    if(!userId){
        throw new ApiError(400, "User id is required!")
    }

    // check if current password is provided
    if(!currentPassword || !newPassword){
        throw new ApiError(400, "Current password and new password are required!")
    }

    try {
        // find user with the given id
        const user = await db.select().from(User).where(eq(User.id, userId)).limit(1)

        if(!user || user.length === 0){
            throw new ApiError(404, "Unauthorized request - User not found!.")
        }

        // compare the current password with the stored one
        const isPasswordMatch = await Bun.password.verify(currentPassword, user[0].password)

        if(!isPasswordMatch){
            throw new ApiError(401, "Invalid current password.")
        }

        // hash the new password
        const hashedPassword = await Bun.password.hash(newPassword)

        // update user password
        const updatedUser = await db.update(User).set({
            password: hashedPassword,
        }).where(eq(User.id, userId)).returning()

        if(!updatedUser || updatedUser.length === 0){
            throw new ApiError(500, "Failed to update user password. Please try again later!")
        }

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "Password updated successfully" )
        )
    } catch (error) {
        console.error('Error updating password:', error);
        throw new ApiError(500, "Internal server error while updating password");
    }
})

/**
 * @description get user profile
 * @headers { Authorization: Bearer <access_token> }
 * @route GET /api/v1/auth/profile
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get user profile
 *     description: Gets the profile of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User profile fetched successfully.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '404':
 *         description: Not Found - User not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const getUserProfile = asyncHandler(async(req: Request, res: Response) => {
    // get the user id from the request
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }
    
    try {
        // find user with the given id
        const user = await db.select().from(User).where(eq(User.id, userId)).limit(1)

        if(!user || user.length === 0){
            throw new ApiError(404, "Unauthorized request - User not found!.")
        }

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "User profile fetched successfully", {
                id: user[0].id,
                name: user[0].name,
                username: user[0].username,
                email: user[0].email,
                isEmailVerified: user[0].isEmailVerified
            })
        )
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw new ApiError(500, "Internal server error while getting user profile");
    }
})

/**
 * @description update user profile
 * @body {string} name
 * @body {string} username
 * @route PUT /api/v1/auth/profile
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /auth/profile:
 *   patch:
 *     tags:
 *       - Auth
 *     summary: Update user profile
 *     description: Updates the profile of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User profile updated successfully.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '404':
 *         description: Not Found - User not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const updateUserProfile = asyncHandler(async(req: Request, res: Response) => {
    // get the user id from the request
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }

    // get the name and username from the body
    const { name, username } = req.body

    try {
        // find user with the given id
        const user = await db.select().from(User).where(eq(User.id, userId)).limit(1)

        if(!user || user.length === 0){
            throw new ApiError(404, "Unauthorized request - User not found!.")
        }

        // update user profile
        const updatedUser = await db.update(User).set({
            name: name ?? user[0].name,
            username: username ?? user[0].username,
        }).where(eq(User.id, userId)).returning()

        if(!updatedUser || updatedUser.length === 0){
            throw new ApiError(500, "Failed to update user profile. Please try again later!")
        }

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "User profile updated successfully", {
                name:updatedUser[0].name,
                username:updatedUser[0].username
            })
        )
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw new ApiError(500, "Internal server error while updating user profile");
    }
})

/**
 * @description delete user profile
 * @headers { Authorization: Bearer <access_token> }
 * @route DELETE /api/v1/auth/delete-profile
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /auth/delete-profile:
 *   delete:
 *     tags:
 *       - Auth
 *     summary: Delete user profile
 *     description: Deletes the profile of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User profile deleted successfully.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '404':
 *         description: Not Found - User not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const deleteUserProfile = asyncHandler(async(req: Request, res: Response) => {
    // get the user id from the request
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }

    try {
        // find user with the given id
        const user = await db.select().from(User).where(eq(User.id, userId)).limit(1)

        if(!user || user.length === 0){
            throw new ApiError(404, "Unauthorized request - User not found!.")
        }

        // delete user profile
        const deletedUser = await db.delete(User).where(eq(User.id, userId)).returning()

        if(!deletedUser || deletedUser.length === 0){
            throw new ApiError(500, "Failed to delete user profile. Please try again later!")
        }

        // Clear authentication cookies
        res.clearCookie("accessToken")
        res.clearCookie("refreshToken")

        // return response
        return res.status(200).json(
            new ApiResponse(200, true, "User profile deleted successfully")
        )
    } catch (error) {
        console.error("User delete error:", error);
        throw new ApiError(500, `Internal server error while deleting user: Please try again.`);
    }
})

/**
 * @description get all problems solved by user
 * @headers { Authorization: Bearer <access_token> }
 * @route GET /api/v1/auth/problems-solved
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /auth/problems-solved:
 *   get:
 *     summary: Get all problems solved by the user
 *     description: Returns a list of problems solved by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Problems fetched successfully.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '404':
 *         description: Not Found - User not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const getAllProblemsSolvedByUser = asyncHandler(async (req: Request, res: Response) => {
  // get the user id from the request
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request - user id not found");
  }
  try {
    // find problems solved by user
    const userProblemLinks = await db.select().from(UserProblems).where(eq(UserProblems.userId, userId));
    if (!userProblemLinks || userProblemLinks.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, true, "No problems solved by the user yet", [])
      );
    }

    const problemIds = userProblemLinks.map((userProblemLink) => userProblemLink.problemId);

    // fetch problems
    const problems = await db.select().from(Problem).where(inArray(Problem.id, problemIds));
    // return response
    return res.status(200).json(
      new ApiResponse(200, true, "Problems fetched successfully", problems)
    );
  } catch (error) {
    console.error("Error getting all problems solved by user:", error);
    throw new ApiError(500, "Internal server error while getting all problems solved by user");
  }
});

/**
 * @description check if user is authenticated
 * @headers { Authorization: Bearer <access_token> }
 * @route GET /api/v1/auth/check-auth
 * @access Private only logged in user can access
 */

/**
 * @openapi
 * /auth/check-auth:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Check if the user is authenticated
 *     description: Checks if the user is authenticated and returns the user data.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User is authenticated.
 *       '401':
 *         description: Unauthorized - User not authenticated.
 *       '500':
 *         description: Internal Server Error.
 */
export const checkAuth = asyncHandler(async(req: Request, res: Response) => {
    try {
        const data = req.user;
        return res.status(200).json(
            new ApiResponse(200, true, "User is authenticated", data)
        )
    } catch (error) {
        console.error('Error checking authentication:', error);
        throw new ApiError(500, "Internal server error while checking authentication");
    }
})