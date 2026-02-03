import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
const data = [
{
  value: 2
},
{
  value: 4
},
{
  value: 3
},
{
  value: 6
},
{
  value: 5
},
{
  value: 8
},
{
  value: 7
},
{
  value: 9
}];

export function HiringVelocitySparkline() {
  return (
    <div className="h-12 w-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false} />

        </LineChart>
      </ResponsiveContainer>
    </div>);

}