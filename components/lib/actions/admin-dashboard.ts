import prisma from "@/lib/prisma";

export async function getFinancialMetrics() {
    const totalRevenueData = await prisma.order.aggregate({
        _sum: {
            totalAmount: true,
        },
    });

    const totalRevenue = totalRevenueData._sum.totalAmount?.toNumber() || 0;
    const salesCount = await prisma.order.count();
    const activeUsers = await prisma.user.count();


    // Weekly Sales Graph

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);


    const weeklyOrders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: sevenDaysAgo,
            },
        },
        select: {
            createdAt: true,
            totalAmount: true,
        },
    });

    const salesByDay: Record<string, number> = {};



    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        if (!salesByDay[dayName]) {
            salesByDay[dayName] = 0;
        }
    }


    // { "Mon": 100, "Tue": 50 }


    //         [
    //   { name: "Tue", total: 0 },   // قبل 6 أيام
    //   { name: "Wed", total: 0 },   // قبل 5 أيام
    //   { name: "Thu", total: 0 },   // ...
    //   { name: "Fri", total: 200 }, // وجد القيمة في salesByDay
    //   { name: "Sat", total: 0 },
    //   { name: "Sun", total: 0 },
    //   { name: "Mon", total: 500 }  // اليوم (أحدث شي)
    // ]

    weeklyOrders.forEach((order: { createdAt: Date; totalAmount: any }) => {
        const dayName = order.createdAt.toLocaleDateString("en-US", {
            weekday: "short",
        });
        if (salesByDay[dayName] !== undefined) {
            salesByDay[dayName] += order.totalAmount.toNumber();
        }
    });

    const weeklySales = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        weeklySales.push({
            name: dayName,
            total: salesByDay[dayName] || 0
        })
    }



    return {
        totalRevenue,
        salesCount,
        activeUsers,
        weeklySales,
    };



}