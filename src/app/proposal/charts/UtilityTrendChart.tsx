'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  projection20Year: string[];
}

export function UtilityTrendChart({ projection20Year }: Props) {
  const data = projection20Year.map((value, index) => ({
    year: `Yr ${index + 1}`,
    cost: parseFloat(value),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7faf0" />
        <XAxis
          dataKey="year"
          tick={{ fill: '#6b8299', fontSize: 9, fontFamily: 'var(--font-montserrat)' }}
          interval={3}
        />
        <YAxis
          tick={{ fill: '#6b8299', fontSize: 9 }}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(v: number | undefined) => [
            v != null
              ? `$${v.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`
              : '$0',
            'Utility Cost',
          ]}
        />
        <Line
          type="monotone"
          dataKey="cost"
          stroke="#00793f"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
