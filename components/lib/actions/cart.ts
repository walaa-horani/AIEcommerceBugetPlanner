"use server"
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";




export async function getCart() {
    const { userId } = await auth();
    if (!userId) return null;

    const cart = await prisma.cart.findUnique({
        where: { clerkUserId: userId },
        include: {
            items: {
                include: {
                    product: true,
                },
                orderBy: {
                    productId: 'asc' // Stable order
                }
            },
        },
    });

    if (!cart) return null;

    return {
        ...cart,
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString(),
        items: cart.items.map(item => ({
            ...item,
            product: {
                ...item.product,
                price: item.product.price.toString(),
                createdAt: item.product.createdAt.toISOString(),
                updatedAt: item.product.updatedAt.toISOString(),
            }
        }))
    };
}


export async function removeFromCart(itemId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Ensure item belongs to user's cart
    const item = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true }
    });

    if (item && item.cart.clerkUserId === userId) {
        await prisma.cartItem.delete({
            where: { id: itemId }
        });

    }
}


export async function addToCart(productId: string, quantity: number = 1) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let cart = await prisma.cart.findUnique({
        where: { clerkUserId: userId },
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { clerkUserId: userId },
        });
    }

    const existingItem = await prisma.cartItem.findFirst({
        where: {
            cartId: cart.id,
            productId: productId,
        },
    });

    if (existingItem) {
        await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
        });
    } else {
        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId: productId,
                quantity: quantity,
            },
        });
    }
    return { success: true };
}



// AI For adding to cart
export async function addAllToCart(items: { productId: string; quantity: number }[]) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // 1. Get or Create Cart (Reusing logic from addToCart essentially)
    let cart = await prisma.cart.findUnique({
        where: { clerkUserId: userId },
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { clerkUserId: userId },
        });
    }

    // 2. Process all items
    // Using a transaction would be ideal, but parallel promises are fine for this scale
    const cartId = cart.id;

    await Promise.all(items.map(async (item) => {
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cartId,
                productId: item.productId,
            },
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + item.quantity },
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: cartId,
                    productId: item.productId,
                    quantity: item.quantity,
                },
            });
        }
    }));

    return { success: true };
}