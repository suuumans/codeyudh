
import express from 'express';
import { 
    registerUser,
    loginUser,
    logoutUser,
    verifyUser,
    getUserProfile,
    updateUserProfile,
    resendVerificationEmail,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    changePassword,
    deleteUserProfile,
    checkAuth
 } from '../controllers/auth.controller.ts';
import { loginUserSchema, registerUserSchema } from '../validators/auth.validators.ts';
import { validate } from '../middlewares/validator.middleware.ts';
import { verifyJWT } from '../middlewares/auth.middleware.ts';

const router = express.Router();

// ----------- Public routes -----------
router.post('/register', validate(registerUserSchema), registerUser);
router.post('/login',validate(loginUserSchema), loginUser);
router.get('/verify', verifyUser);
router.post('/resend-verification-email', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-access-token', refreshAccessToken); // This can be public but needs a cookie

// ----------- Private routes -----------
router.use(verifyJWT);
router.get('/check', checkAuth);
router.post('/logout', logoutUser);
router.get('/profile', getUserProfile);
router.patch('/update-profile', updateUserProfile); // PATCH for partial updates
router.post('/change-password', changePassword);
router.delete('/delete-profile', deleteUserProfile);

export default router;