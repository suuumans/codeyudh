
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

// ----------- Private routes -----------
router.use(verifyJWT);
router.get('/check', checkAuth);
router.post('/logout', logoutUser);
router.get('/profile', getUserProfile);
router.put('/update-profile', updateUserProfile);
router.post('/change-password', changePassword);
router.delete('/delete-profile', deleteUserProfile);

router.post('/resend-verification-email', resendVerificationEmail);
router.post('/refresh-access-token', refreshAccessToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;