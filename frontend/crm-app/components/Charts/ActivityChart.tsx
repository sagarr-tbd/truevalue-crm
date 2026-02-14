"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface ActivityChartProps {
  data?: Array<{
    date: string;
    calls: number;
    meetings: number;
    emails: number;
  }>;
  timeRange?: "7d" | "30d" | "90d";
}

export function ActivityChart({ data, timeRange = "30d" }: ActivityChartProps) {
  const chartData = useMemo(() => {
    if (data) return data;

    // // Generate mock data based on time range
    // const periods = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    // const mockData = [];
    // for (let i = periods - 1; i >= 0; i--) {
    //   const date = new Date();
    //   date.setDate(date.getDate() - i);
    //   mockData.push({
    //     date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    //     calls: Math.floor(Math.random() * 30) + 20,
    //     meetings: Math.floor(Math.random() * 15) + 5,
    //     emails: Math.floor(Math.random() * 50) + 30,
    //   });
    // }
    // return mockData;
    return [];
  }, [data, timeRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activity Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="calls"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
              name="Calls"
            />
            <Line
              type="monotone"
              dataKey="meetings"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--secondary))", r: 4 }}
              activeDot={{ r: 6 }}
              name="Meetings"
            />
            <Line
              type="monotone"
              dataKey="emails"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--accent))", r: 4 }}
              activeDot={{ r: 6 }}
              name="Emails"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
