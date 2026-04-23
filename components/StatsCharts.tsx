"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { YearlyStat } from "@/lib/api/stats";

type Props = { data: YearlyStat[] };

const SUCCESS_COLOR = "#10b981";
const FAILURE_COLOR = "#f43f5e";
const UPCOMING_COLOR = "#0ea5e9";
const LINE_COLOR = "#6366f1";

export function LaunchesPerYearChart({ data }: Props): React.JSX.Element {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12, fill: "currentColor" }}
            stroke="currentColor"
            strokeOpacity={0.3}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "currentColor" }}
            stroke="currentColor"
            strokeOpacity={0.3}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(24 24 27 / 0.95)",
              border: "1px solid rgb(63 63 70)",
              borderRadius: 8,
              fontSize: 12,
              color: "rgb(244 244 245)",
            }}
            cursor={{ fill: "currentColor", fillOpacity: 0.05 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="success" stackId="a" name="Success" fill={SUCCESS_COLOR} />
          <Bar dataKey="failure" stackId="a" name="Failure" fill={FAILURE_COLOR} />
          <Bar dataKey="upcoming" stackId="a" name="Upcoming" fill={UPCOMING_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SuccessRateChart({ data }: Props): React.JSX.Element {
  const withRate = data.filter((d) => d.successRate !== null);
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={withRate} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12, fill: "currentColor" }}
            stroke="currentColor"
            strokeOpacity={0.3}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 12, fill: "currentColor" }}
            stroke="currentColor"
            strokeOpacity={0.3}
          />
          <Tooltip
            formatter={(value) => [`${value ?? "—"}%`, "Success rate"]}
            contentStyle={{
              backgroundColor: "rgb(24 24 27 / 0.95)",
              border: "1px solid rgb(63 63 70)",
              borderRadius: 8,
              fontSize: 12,
              color: "rgb(244 244 245)",
            }}
          />
          <Line
            type="monotone"
            dataKey="successRate"
            name="Success rate"
            stroke={LINE_COLOR}
            strokeWidth={2}
            dot={{ r: 4, stroke: LINE_COLOR, fill: LINE_COLOR }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OutcomePieMini({ data }: Props): React.JSX.Element {
  // Horizontal mini bar — total success vs failure vs upcoming across all time.
  const totals = data.reduce(
    (acc, d) => {
      acc.success += d.success;
      acc.failure += d.failure;
      acc.upcoming += d.upcoming;
      return acc;
    },
    { success: 0, failure: 0, upcoming: 0 },
  );
  const rows = [{ name: "All time", ...totals }];
  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(24 24 27 / 0.95)",
              border: "1px solid rgb(63 63 70)",
              borderRadius: 8,
              fontSize: 12,
              color: "rgb(244 244 245)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="success" stackId="s" name="Success" fill={SUCCESS_COLOR} />
          <Bar dataKey="failure" stackId="s" name="Failure" fill={FAILURE_COLOR} />
          <Bar dataKey="upcoming" stackId="s" name="Upcoming" fill={UPCOMING_COLOR}>
            <Cell fill={UPCOMING_COLOR} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
