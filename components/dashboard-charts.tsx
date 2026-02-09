"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

interface OverviewChartProps {
    data: {
        name: string;
        total: number;
    }[];
}


function DashboardCharts({ data }: OverviewChartProps) {
    return (
        <Card className='col-span-4'>
            <CardHeader>
                <CardTitle>Weekly Sales Graph</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">

                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>

                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value: number) => `$${value}`}
                        />

                        <Tooltip
                            formatter={(value: number | undefined) => [`$${value ?? 0}`, "Revenue"]}
                            cursor={{ fill: 'transparent' }}
                        />

                        <Bar
                            dataKey="total"
                            fill="#10b981" // Emerald-500
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>

            </CardContent>
        </Card>
    )
}

export default DashboardCharts