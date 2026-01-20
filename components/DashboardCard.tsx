import { LucideIcon } from "lucide-react";


import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface DashboardCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
}

function DashboardCard({ title, value, icon: Icon }: DashboardCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

export default DashboardCard