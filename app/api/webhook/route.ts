import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`[Webhook] Event type: ${event.type}`);

    if (event.type === "checkout.session.completed") {
        const userId = session.metadata?.userId;
        const cartId = session.metadata?.cartId;
        console.log(`[Webhook] Processing checkout for user: ${userId}, cart: ${cartId}`);

        if (!userId || !cartId) {
            console.error("[Webhook] Missing metadata");
            return new NextResponse("Webhook Error: Missing metadata", { status: 400 });
        }

        try {
            // 1. Get transaction details
            // Note: For real apps, you might want to fetch line items from Stripe if you didn't trust the cart state,
            // but here we trust the cart state at the time of checkout initiation or re-fetch it.
            // Better: Fetch the cart items again to be sure what we are ordering.

            const cart = await prisma.cart.findUnique({
                where: { id: cartId },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            if (!cart) {
                // If cart is already gone, maybe it was processed?
                console.error(`[Webhook] Cart not found: ${cartId}`);
                return new NextResponse("Cart not found", { status: 404 });
            }

            console.log(`[Webhook] Found cart with ${cart.items.length} items`);

            // 2. Create Order
            const order = await prisma.order.create({
                data: {
                    clerkUserId: userId,
                    totalAmount: Number(session.amount_total) / 100, // Convert from cents
                    stripeSessionId: session.id,
                    status: "PROCESSING", // Or PENDING, as per your enum
                    orderItems: {
                        create: cart.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price // Snapshot the price
                        }))
                    }
                },
            });

            console.log(`[Webhook] Order created: ${order.id}`);

            // 3. Clear Cart
            // Delete all cart items
            await prisma.cartItem.deleteMany({
                where: {
                    cartId: cart.id,
                },
            });

            console.log("[Webhook] Cart cleared");

            // Optionally delete the cart itself if you want a fresh cart every time, 
            // but usually keeping the cart for the user and just emptying items is fine.
            // Your implementation seems to have a permanent cart per user (unique clerkUserId).

        } catch (error: any) {
            console.error("Error processing webhook:", error);
            return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
        }
    }

    return new NextResponse(null, { status: 200 });
}
