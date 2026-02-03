import React from 'react';
interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
}
export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp
}: MetricCardProps) {
  return (
    <div
      className="bg-[#0a0a0a] text-white p-6 rounded-sm flex flex-col justify-between h-40 group hover:ring-2 hover:ring-indigo-500 transition-all duration-300"
      style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}
    >
      <div className="flex justify-between items-start">
        <span
          className="text-gray-400 text-sm font-medium tracking-wide uppercase"
          style={{ color: 'rgb(156, 163, 175)' }}
        >
          {label}
        </span>
        <Icon className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors" style={{ color: 'rgb(107, 114, 128)' }} />
      </div>

      <div className="mt-auto">
        <div className="text-5xl font-extrabold tracking-tighter leading-none" style={{ color: '#ffffff' }}>
          {value}
        </div>
        {trend &&
        <div
          className={`text-xs mt-2 font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}
          style={{ color: trendUp ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)' }}
        >
            {trend}
          </div>
        }
      </div>
    </div>);

}