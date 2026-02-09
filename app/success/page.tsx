import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

interface SuccessPageProps {
    searchParams: Promise<{
        session_id?: string;
    }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
    const { session_id } = await searchParams;

    if (!session_id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <p className="text-red-500">Invalid Session</p>
                <Button className="mt-4">
                    <Link href="/">Return to Home</Link>
                </Button>
            </div>
        )
    }

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-12-15.clover",
        });

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            const cartId = session.metadata?.cartId;
            const userId = session.metadata?.userId;

            if (cartId && userId) {
                // Check if order exists to prevent duplicates
                const existingOrder = await prisma.order.findFirst({
                    where: { stripeSessionId: session.id }
                });

                if (!existingOrder) {
                    // Webhook failed or hasn't fired yet - Fulfill order here
                    const cart = await prisma.cart.findUnique({
                        where: { id: cartId },
                        include: {
                            items: {
                                include: { product: true }
                            }
                        }
                    });

                    if (cart && cart.items.length > 0) {
                        // Create Order
                        await prisma.order.create({
                            data: {
                                clerkUserId: userId,
                                totalAmount: Number(session.amount_total) / 100,
                                stripeSessionId: session.id,
                                status: "PROCESSING",
                                orderItems: {
                                    create: cart.items.map((item) => ({
                                        productId: item.productId,
                                        quantity: item.quantity,
                                        price: item.product.price
                                    }))
                                }
                            },
                        });

                        // Clear Cart
                        await prisma.cartItem.deleteMany({
                            where: { cartId: cart.id }
                        });
                    }
                } else {
                    // Order exists, just ensure cart is clear (idempotency)
                    // This handles the edge case where order created but cart delete failed
                    await prisma.cartItem.deleteMany({
                        where: { cartId: cartId }
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error verifying payment in success page:", error);
        // Continue to show success page, but maybe log this critical error
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="bg-green-100 p-6 rounded-full mb-6 dark:bg-green-900/30">
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
                Thank you for your purchase. Your order has been processed successfully.
                <span className="block mt-2 text-sm text-gray-400">
                    Transaction ID: {session_id}
                </span>
            </p>
            <div className="flex gap-4">
                <Button >
                    <Link href="/">Return to Home</Link>
                </Button>
                <Button variant="outline">
                    <Link href="/shop">Continue Shopping</Link>
                </Button>
            </div>
        </div>
    );
}
