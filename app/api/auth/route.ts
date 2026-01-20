import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from '@/lib/prisma'


export async function POST(req: Request) {

    const { userId } = await auth()
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    console.log('[USER_SYNC] Request body:', body)
    const { email, firstName, lastName, username } = body
    if (!email) {
        return new NextResponse('Email is required', { status: 400 })
    }
    try {
        await db.user.upsert({
            where: {
                id: userId,
            },
            update: {
                email,
                firstName,
                lastName,

                username
            },
            create: {
                id: userId,
                email,
                firstName,
                lastName,

                username
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[USER_SYNC]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }

}
