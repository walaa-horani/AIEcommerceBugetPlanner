"use server"

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getUserOrders() {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const orders = await prisma.order.findMany({
            where: {
                clerkUserId: userId
            },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return { success: true, data: orders };
    } catch (error) {
        console.error("Error fetching orders:", error);
        return { success: false, error: "Failed to fetch orders" };
    }
}
