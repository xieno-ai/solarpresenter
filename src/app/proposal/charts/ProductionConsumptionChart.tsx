'use client';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SerializedMonthlyNetMetering } from '@/app/actions/calculate';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  monthlyNetMetering: SerializedMonthlyNetMetering[];
}

export function ProductionConsumptionChart({ monthlyNetMetering }: Props) {
  const data = monthlyNetMetering.map((m, i) => ({
    month: MONTHS[i],
    consumption: parseFloat(m.consumptionKwh),
    production: parseFloat(m.productionKwh),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7faf0" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#6b8299', fontSize: 10, fontFamily: 'var(--font-montserrat)' }}
        />
        <YAxis tick={{ fill: '#6b8299', fontSize: 10 }} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="consumption"
          name="Consumption (kWh)"
          fill="#ecf7ff"
          stroke="#6b8299"
          strokeWidth={1}
        />
        <Line
          type="monotone"
          dataKey="production"
          name="Production (kWh)"
          stroke="#00793f"
          strokeWidth={2}
          dot={{ fill: '#00793f', r: 3 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
