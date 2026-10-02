"use client";

/**
 * Every chart that uses recharts.
 *
 * This module is only ever imported through `dynamic()` in `charts.tsx`, so the
 * 413 kB charting library lands in an async chunk and never blocks first paint on
 * the dashboard. Nothing outside this file may import recharts directly.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUSD } from "@/lib/utils";

const AXIS = { stroke: "rgba(255,255,255,0.18)", fontSize: 11, tickLine: false, axisLine: false };
const TOOLTIP_STYLE = {
  background: "rgba(10,13,22,0.94)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 18px 50px -20px rgba(0,0,0,0.9)",
} as const;

export function RevenueChart({ data }: { data: Array<{ date: string; revenue: number; sales?: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00ff9d" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#00ff9d" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="revStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5cffb4" />
            <stop offset="100%" stopColor="#10e0a0" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="date" {...AXIS} />
        <YAxis {...AXIS} tickFormatter={(v: number) => `$${Math.round(v / 100)}`} width={52} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ stroke: "rgba(0,255,157,0.3)" }}
          formatter={(value, name) => [formatUSD(Number(value)), name === "revenue" ? "Net revenue" : "Sales"]}
        />
        <Area type="monotone" dataKey="revenue" stroke="url(#revStroke)" strokeWidth={2.2} fill="url(#revFill)" animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ViewsChart({ data }: { data: Array<{ date: string; views: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10e0a0" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#10e0a0" stopOpacity={0.25} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="date" {...AXIS} />
        <YAxis {...AXIS} width={40} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={(value) => [Number(value).toLocaleString(), "Views"]}
        />
        <Bar dataKey="views" fill="url(#viewsBar)" radius={[4, 4, 0, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data }: { data: Array<{ label: string; value: number; hue: string }> }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={3}
              strokeWidth={0}
              animationDuration={800}
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.hue} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => [`${value} (${Math.round((Number(value) / total) * 100)}%)`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2">
        {data.map((entry) => (
          <li key={entry.label} className="flex items-center justify-between gap-3 text-[12.5px]">
            <span className="flex items-center gap-2 text-mist-300">
              <span className="size-2 rounded-full" style={{ background: entry.hue, boxShadow: `0 0 8px ${entry.hue}` }} />
              {entry.label}
            </span>
            <span className="tnum text-mist-100">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}