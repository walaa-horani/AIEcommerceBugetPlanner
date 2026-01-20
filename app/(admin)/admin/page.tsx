import DashboardCharts from '@/components/dashboard-charts';
import DashboardCard from '@/components/DashboardCard';
import { getFinancialMetrics } from '@/components/lib/actions/admin-dashboard';
import { formatter } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';
import { CreditCard, DollarSign, Users } from 'lucide-react';
import React from 'react'

async function AdminPage() {

    const { userId, redirectToSignIn } = await auth();

    if (!userId) return redirectToSignIn();

    const { totalRevenue, salesCount, activeUsers, weeklySales } = await getFinancialMetrics();

    return (
        <div className='min-h-screen bg-gray-50 p-8'>

            <div className='max-w-7xl mx-auto space-y-8'>

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-emerald-900">Admin Dashboard</h1>
                    <div className="text-sm text-muted-foreground">Welcome, User</div>
                </div>


                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <DashboardCard
                        title="Total Revenue"
                        value={formatter.format(totalRevenue)}
                        icon={DollarSign}
                    />
                    <DashboardCard
                        title="Sales Count"
                        value={`+${salesCount}`}
                        icon={CreditCard}
                    />
                    <DashboardCard
                        title="Active Users"
                        value={`+${activeUsers}`}
                        icon={Users}
                    />
                </div>

                <DashboardCharts data={weeklySales} />
            </div>
        </div>
    )
}

export default AdminPage