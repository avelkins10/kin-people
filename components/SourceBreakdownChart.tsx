import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend } from
'recharts';
const data = [
{
  name: 'Referrals',
  value: 45,
  color: '#6366f1'
},
{
  name: 'Indeed',
  value: 25,
  color: '#818cf8'
},
{
  name: 'LinkedIn',
  value: 20,
  color: '#a5b4fc'
},
{
  name: 'Direct',
  value: 10,
  color: '#c7d2fe'
} // Indigo 200
];
export function SourceBreakdownChart() {
  return (
    <div className="w-full h-[350px] bg-white p-6 border border-gray-100 rounded-sm">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-extrabold tracking-tight text-black uppercase">
          Source Breakdown
        </h3>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value">

            {data.map((entry, index) =>
            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            )}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0a0a0a',
              border: 'none',
              borderRadius: '2px',
              color: '#fff',
              fontWeight: 'bold'
            }}
            itemStyle={{
              color: '#fff'
            }} />

          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) =>
            <span className="text-black font-bold text-xs uppercase ml-1">
                {value}
              </span>
            } />

        </PieChart>
      </ResponsiveContainer>
    </div>);

}