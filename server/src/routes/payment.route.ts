
import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { createOrder, verifyPayment } from '../controllers/payment.controller';

const router = Router();

router.use(verifyJWT);
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

export default router;