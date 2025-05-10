
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
export const registerUser = asyncHandler( async (req: Request, res: Response) => {
    const { name, username, email, password } = req.body

    if (!(name && username && email && password)) {
        throw new ApiError(400, "All input fields are required")
    }
    try {
        
        // Check if user already exists
        const existingUser = await db.select().from(User).where(eq(User.email, email)).limit(1)
        if (!existingUser || existingUser.length > 0) {
            throw new ApiError(400, "User already exists")
        }
    
        // hash password
        const hashedPassword = await Bun.password.hash(password)
    
        const newUserResult = await db.insert(User).values({
            name,
            username,
            email,
            password: hashedPassword,
        }).returning()
    
        if (!newUserResult) {
            throw new ApiError(500, "User registration failed during database insertion. Please try again later.")
        }

        const newUser = newUserResult[0]

        // generate verification token
        const { unhashedToken, hashedToken, tokenExpiry } = await generateVerificationToken()

        // update verification token in data base
        const updatedUser = await db.update(User).set({
            verificationToken: hashedToken,
            verificationTokenExpiry: tokenExpiry,
            isEmailVerified: false,
        }).where(eq(User.id, newUser.id)).returning()

        if (!updatedUser || updatedUser.length === 0) {
            throw new ApiError(500, "User registration failed during database insertion. Please try again later.")
        }

        // create verification url for email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${unhashedToken}`

        // generate email content
        const mailGenContent = emailVerificationGenContent(newUser.name, verificationUrl)

        // send verification email
        try {
            await sendMail({
                email: newUser.email,
                subject: "Verify your email address",
                mailgenContent: mailGenContent
            })


            return res.status(201).json(
                new ApiResponse(201,
                    true,
                    "User registered successfully",
                    {
                        user: {
                            id: newUser,
                            name: newUser.name,
                            username: newUser.username,
                            email: newUser.email,
                            isEmailVerified: false,
                        }
                    }
                )
            )
        } catch (error) {
            console.error('Error sending verification email: ', error);
            return new ApiError(500, "Failed to send verification email. Please try again later.");
        }

    } catch (error) {
        console.log("Error registering user: ", error)
        throw new ApiError(500, "Internal server error. User registration failed. Please try again later.")
    }
})

/**
 * @description login user
 * @body { email: string, password: string } 
 * @route POST /api/v1/auth/login
 * @access Public anyone can access login route
 */
export const loginUser = asyncHandler( async (req: Request, res: Response) => {
    const { email, password } = req.body

    if (!(email && password)) {
        throw new ApiError(400, "All input fields are required")
    }

    try {
        // check if user exists with the given email
        const existingUser = await db.select().from(User).where(eq(User.email, email)).limit(1)
        if (!existingUser || existingUser.length === 0) {
            throw new ApiError(404, "User not found with the given email")
        }
        const user = existingUser[0]
        // check if password is correct
        const isPasswordCorrect = await Bun.password.verify(password, user.password)
        if (!isPasswordCorrect) {
            throw new ApiError(401, "Invalid password! Please enter correct password.")
        }

        // check if email is verified
        if (!user.isEmailVerified) {
            throw new ApiError(401, "Email not verified! Please verify your email.")
        }

        // generate access & refresh token
        const { accessToken, refreshToken } = await generateAuthTokens(user)

        // store the token in db
        await db.update(User).set({
            refreshToken,
            // refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }).where(eq(User.id, user.id)).returning()

        // create cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.BUN_ENV === "production",
        }

        // set cookies
        res.cookie("accessToken", accessToken, cookieOptions)
        res.cookie("refreshToken", refreshToken, cookieOptions)

        // return response
        return res.status(200).json(
            new ApiResponse(200,
                true,
                "User logged in successfully",
                {
                    user: {
                        id: user.id,
                        name: user.name,
                        username: user.username,
                        email: user.email,
                        isEmailVerified: user.isEmailVerified,
                    }
                }
            )
        )

    } catch (error) {
        console.error("Login user error: ", error)
        return new ApiError(500, "Internal server error while logging in user!")
    }
})

/**
 * @description logout user
 * @headers { Authorization: Bearer <access_token> }
 * @route POST /api/v1/auth/logout
 * @access Private only logged in user can access
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
            verificationToken: hashedToken,
            verificationTokenExpiry: tokenExpiry,
        }).where(eq(User.id, user[0].id)).returning()

        // create reset password url
        const resetPasswordUrl = `${process.env.CLIENT_URL}/reset-password?token=${unhashedToken}`

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
        const user = await db.select().from(User).where(eq(User.verificationToken, hashedToken)).limit(1)

        if(!user || user.length === 0){
            throw new ApiError(404, "User not found! Please enter valid token.")
        }

        // hash the password
        const hashedPassword = await Bun.password.hash(password)

        // update user password
        const updatedUser = await db.update(User).set({
            password: hashedPassword,
            verificationToken: null,
            verificationTokenExpiry: null,
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
