import React from 'react';
import { Users, TrendingUp, Clock, FileSignature } from 'lucide-react';
interface MetricProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  trendUp?: boolean;
}
function Metric({ label, value, subtext, icon: Icon, trendUp }: MetricProps) {
  return (
    <div className="bg-[#0a0a0a] text-white p-5 rounded-sm flex flex-col justify-between h-32 group hover:ring-2 hover:ring-indigo-500 transition-all duration-300">
      <div className="flex justify-between items-start">
        <span className="text-gray-400 text-xs font-bold tracking-wide uppercase">
          {label}
        </span>
        <Icon className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
      </div>

      <div className="mt-auto">
        <div className="text-3xl font-extrabold tracking-tighter leading-none mb-2">
          {value}
        </div>
        <div
          className={`text-[10px] font-medium ${trendUp ? 'text-green-400' : 'text-gray-400'}`}>

          {subtext}
        </div>
      </div>
    </div>);

}
export function PipelineMetrics() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
      <Metric
        label="Active Recruits"
        value="28"
        subtext="12 Lead, 8 Interview, 5 Agreement, 3 Onboard"
        icon={Users} />

      <Metric
        label="Conversion Rate"
        value="34%"
        subtext="Lead → Converted"
        icon={TrendingUp}
        trendUp={true} />

      <Metric
        label="Avg Time to Hire"
        value="18 days"
        subtext="-3 days vs last month"
        icon={Clock}
        trendUp={true} />

      <Metric
        label="Agreements Pending"
        value="5"
        subtext="Awaiting signature"
        icon={FileSignature} />

    </div>);

}