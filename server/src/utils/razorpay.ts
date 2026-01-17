
import Razorpay from "razorpay";

let razorpayInstance: Razorpay | null = null;

// Lazy initialization of Razorpay - only initialize when needed
export const getRazorpayInstance = (): Razorpay => {
    if (!razorpayInstance) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
        }
        
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        
        console.log('✅ Razorpay initialized successfully');
    }
    return razorpayInstance;
};

// Keep backward compatibility - but this will be deprecated
export const razorpay = {
    get instance() {
        return getRazorpayInstance();
    }
};