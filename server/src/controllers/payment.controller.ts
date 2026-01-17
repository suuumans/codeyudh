
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/apiError.ts";
import { db } from "../db/db.ts";
import { and, eq } from "drizzle-orm";
import { Payment } from "../db/schema/payment.schema.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { getRazorpayInstance } from "../utils/razorpay.ts";
import { Playlist } from "../db/schema/playlist.schema.ts";
import crypto from "crypto";
import { UserPlaylistAccess } from "../db/schema/userPlaylistAccess.schema.ts";
import { inngest } from "../utils/notification/inngest.ts";


/**
 * @description Create a Razorpay order for a playlist
 * @body { amount: number, playlistId: string, currency: string }
 * @route POST /api/v1/payment/create-order
 * @access Private only logged in user can access
 */

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const { playlistId, amount } = req.body
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }
    if (!playlistId || !amount ) {
        throw new ApiError(400, "Playlist id, amount are required!")
    }

    // validate the playlist exists and is a paid playlist
    const existingPlaylist = await db.select().from(Playlist).where(eq(Playlist.id, playlistId)).limit(1)

    if (existingPlaylist.length === 0) {
        throw new ApiError(404, "Playlist not found")
    }
    if (!existingPlaylist[0].isPaid) {
        throw new ApiError(400, "This Playlist is not a paid playlist")
    }

    // check if the user already has access to this playlist
    const existingPayment = await db.select().from(Payment).where(
        and(
            eq(Payment.userId, userId),
            eq(Payment.playlistId, playlistId),
            eq(Payment.status, "success")
        )
    )
    if (existingPayment) {
        throw new ApiError(400, "You already have access to this playlist")
    }

    // create the order
    const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `playlist:${playlistId}`,
        notes: {
            userId,
            playlistId
        }
    }

    try {
        const razorpayInstance = getRazorpayInstance();
        const order = await razorpayInstance.orders.create(options)
        // store the order in the database
        await db.insert(Payment).values({
            userId,
            playlistId,
            amount,
            status: "pending",
            razorpayOrderId: order.id,
            razorpayPaymentId: "", // will be filled after successful payment verification
            razorpaySignature: ""
        })
        res.status(200).json(
            new ApiResponse(
                200, true, "Order created successfully", { orderId: order.id }
            )
        )
    } catch (error) {
        console.error("Error creating order: ", error)
        throw new ApiError(500, "Could not create order")
    }
})

/**
 * @description Verify a Razorpay payment and save it to the database
 * @body { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }
 * @route POST /api/v1/payment/verify-payment
 * @access Private only logged in user can access
*/

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
    const userId = req.user?.id
    if(!userId){
        throw new ApiError(401, "Unauthorized request - user id not found")
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature ) {
        throw new ApiError(400, "Order id, payment id and signature are required!")
    }

    // verify if the payment has already been processed
    const existingPayment = await db.select().from(Payment).where(
        eq(Payment.razorpayOrderId, razorpay_order_id)
    ).limit(1)

    if (existingPayment.length > 0 && existingPayment[0].status === "success") {
        throw new ApiError(400, "Payment has already been processed")
    }

    // verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id

    // const expectedSignature = crypto.createHmac(
    //     "sha256",
    //     process.env.RAZORPAY_KEY_SECRET as string
    // ).update(body.toString()).digest("hex")

    // using bun crypto hasher
    const expectedSignature = new Bun.CryptoHasher("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString()).digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
        throw new ApiError(400, "Invalid payment signature, could not verify payment")
    }

    // fetch payment details from Razorpay to double-check
    const razorpayInstance = getRazorpayInstance();
    const paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id)

    // Verify payment is authorized/captured and matches out order
    if (paymentDetails.status !== "authorized" && paymentDetails.status !== "captured") {
        throw new ApiError(400, `Payment not completed. Status: ${paymentDetails.status}`)
    }
    if (paymentDetails.order_id !== razorpay_order_id) {
        throw new ApiError(400, "Payment verification failed: order ID mismatch");
    }

    // find or create payment record
    let paymentRecord

    if (existingPayment.length > 0) {
        // update the existing payment record
        paymentRecord = await db.update(Payment).set({
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: "success"
        }).where(eq(Payment.razorpayOrderId, razorpay_order_id)).returning()
        } else {
        // extract playlistId from order receipt
        const razorpayInstance = getRazorpayInstance();
        const orderDetails = await razorpayInstance.orders.fetch(razorpay_order_id)
        const receipt = typeof orderDetails.receipt === "string" ? orderDetails.receipt : ""
        const receiptParts = receipt.split(":")
        const extractedPlaylistId = receiptParts.length > 1 && receiptParts[1].trim() !== "" ? receiptParts[1].trim() : undefined

        if (!extractedPlaylistId) {
            throw new ApiError(400, "Could not extract playlistId from order receipt")
        }

        // create a new payment record
        paymentRecord = await db.insert(Payment).values({
            userId,
            playlistId: extractedPlaylistId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            amount: Number(paymentDetails.amount) / 100,
            status: "success"
        }).returning()
    }

    // Grant user access to the playlist
    const playlistId = existingPayment.length > 0
        ? existingPayment[0].playlistId
        : paymentRecord[0].playlistId

    await db.insert(UserPlaylistAccess).values({
        userId,
        playlistId,
        grantedAt: new Date()
    }).onConflictDoNothing() // in case user already has access

    // Send an event to Inngest to create a notification
    const playlistDetails = await db.select({ name: Playlist.name }).from(Playlist).where(eq(Playlist.id, playlistId)).limit(1);
    await inngest.send({
        name: "payment.succeeded",
        data: {
            userId,
            playlistId,
            playlistName: playlistDetails[0]?.name || "a playlist",
            // Construct a URL to the playlist page on your frontend
            linkUrl: `/playlist/${playlistId}`,
        }
    });

    res.status(200).json(
        new ApiResponse(200, true, "Payment verified successfully and access granted", paymentRecord[0] )
    )
})