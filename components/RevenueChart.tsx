import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
const data = [
{
  name: 'Jan',
  value: 24000
},
{
  name: 'Feb',
  value: 13980
},
{
  name: 'Mar',
  value: 38000
},
{
  name: 'Apr',
  value: 39080
},
{
  name: 'May',
  value: 48000
},
{
  name: 'Jun',
  value: 58000
}];

export function RevenueChart() {
  return (
    <div className="w-full h-[350px] bg-white p-6 border border-gray-100 rounded-sm">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-bold tracking-tight text-black">
          Revenue Overview
        </h3>
        <div className="flex gap-2">
          <span className="inline-block w-3 h-3 bg-indigo-500 rounded-full"></span>
          <span className="text-xs text-gray-500 font-medium">
            Current Period
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            bottom: 5,
            left: 0
          }}>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f3f4f6" />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: '#6b7280',
              fontSize: 12,
              fontWeight: 500
            }}
            dy={10} />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: '#6b7280',
              fontSize: 12,
              fontWeight: 500
            }}
            tickFormatter={(value) => `$${value / 1000}k`} />

          <Tooltip
            contentStyle={{
              backgroundColor: '#0a0a0a',
              border: 'none',
              borderRadius: '2px',
              color: '#fff'
            }}
            itemStyle={{
              color: '#fff'
            }}
            cursor={{
              stroke: '#e5e7eb',
              strokeWidth: 1
            }} />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{
              r: 4,
              fill: '#6366f1',
              strokeWidth: 2,
              stroke: '#fff'
            }}
            activeDot={{
              r: 6,
              fill: '#6366f1',
              strokeWidth: 0
            }} />

        </LineChart>
      </ResponsiveContainer>
    </div>);

}