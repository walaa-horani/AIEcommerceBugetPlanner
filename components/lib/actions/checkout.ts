"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover", // Latest API version
});

export async function createCheckoutSession() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const cart = await prisma.cart.findUnique({
        where: { clerkUserId: userId },
        include: {
            items: {
                include: { product: true }
            }
        }
    });

    if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
    }

    const lineItems = cart.items.map((item) => ({
        price_data: {
            currency: "usd",
            product_data: {
                name: item.product.name,
                images: [item.product.image],
            },
            unit_amount: Math.round(Number(item.product.price) * 100), // Stripe expects cents
        },
        quantity: item.quantity,
        // 10.50 دولار.
        // 1050
    }));

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
        metadata: {
            userId: userId,
            cartId: cart.id
        },
    });

    return { url: session.url };
}
