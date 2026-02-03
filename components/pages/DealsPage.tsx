"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/MetricCard';
import {
  DollarSign,
  CheckCircle,
  Clock,
  Zap,
  Plus,
  Filter,
  MoreHorizontal,
  Sun,
  Wind,
  Home } from
'lucide-react';
import { useModals } from '@/components/ModalsContext';
type DealStatus =
'Sold' |
'Pending' |
'Permitted' |
'Scheduled' |
'Installed' |
'PTO' |
'Cancelled';
type DealType = 'Solar' | 'HVAC' | 'Roofing';
interface Deal {
  id: string;
  customer: string;
  setter: string;
  closer: string;
  type: DealType;
  systemSize: string;
  value: string;
  status: DealStatus;
  date: string;
}
const deals: Deal[] = [
{
  id: '1',
  customer: 'John Smith',
  setter: 'James Chen',
  closer: 'Sarah Jenkins',
  type: 'Solar',
  systemSize: '8.4 kW',
  value: '$32,500',
  status: 'PTO',
  date: 'Oct 24, 2023'
},
{
  id: '2',
  customer: 'Alice Johnson',
  setter: 'Emily Davis',
  closer: 'Mike Ross',
  type: 'HVAC',
  systemSize: '-',
  value: '$12,800',
  status: 'Installed',
  date: 'Oct 23, 2023'
},
{
  id: '3',
  customer: 'Bob Wilson',
  setter: 'James Chen',
  closer: 'James Chen',
  type: 'Solar',
  systemSize: '12.2 kW',
  value: '$48,000',
  status: 'Permitted',
  date: 'Oct 22, 2023'
},
{
  id: '4',
  customer: 'Carol White',
  setter: 'Dwight Schrute',
  closer: 'Michael Scott',
  type: 'Roofing',
  systemSize: '-',
  value: '$22,100',
  status: 'Pending',
  date: 'Oct 21, 2023'
},
{
  id: '5',
  customer: 'David Brown',
  setter: 'Emily Davis',
  closer: 'Sarah Jenkins',
  type: 'Solar',
  systemSize: '6.8 kW',
  value: '$24,500',
  status: 'Sold',
  date: 'Oct 20, 2023'
}];

export function DealsPage() {
  const { openNewDeal } = useModals();
  const getStatusStyles = (status: DealStatus) => {
    switch (status) {
      case 'PTO':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Installed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Permitted':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Sold':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  const getTypeIcon = (type: DealType) => {
    switch (type) {
      case 'Solar':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'HVAC':
        return <Wind className="w-4 h-4 text-blue-500" />;
      case 'Roofing':
        return <Home className="w-4 h-4 text-red-500" />;
    }
  };
  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Deals Tracker
          </h1>
          <p className="text-gray-500 font-medium">
            Monitor sales performance from contract to install.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={openNewDeal}>
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <MetricCard
          label="Total Revenue"
          value="$142.5k"
          icon={DollarSign}
          trend="+12% vs last month"
          trendUp={true} />

        <MetricCard
          label="Deals Sold"
          value="18"
          icon={Zap}
          trend="5 this week"
          trendUp={true} />

        <MetricCard
          label="Install Pending"
          value="8"
          icon={Clock}
          trend="Avg 12 days"
          trendUp={true} />

        <MetricCard
          label="PTO Complete"
          value="4"
          icon={CheckCircle}
          trend="This month"
          trendUp={true} />

      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white border border-gray-100 rounded-sm">
        <div className="flex items-center gap-2 text-gray-500 mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">
            Filters
          </span>
        </div>
        <select className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide">
          <option>Status: All</option>
          <option>Sold</option>
          <option>Installed</option>
          <option>PTO</option>
        </select>
        <select className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide">
          <option>Type: All</option>
          <option>Solar</option>
          <option>HVAC</option>
          <option>Roofing</option>
        </select>
        <select className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide">
          <option>Office: All</option>
          <option>Phoenix HQ</option>
          <option>Denver</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  System Size
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Setter / Closer
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.map((deal) =>
              <tr
                key={deal.id}
                className="hover:bg-gray-50 transition-colors group">

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-black">
                      {deal.customer}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(deal.type)}
                      <span className="text-sm font-medium text-gray-700">
                        {deal.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-black">
                      {deal.value}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {deal.systemSize}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900">
                        S: {deal.setter}
                      </span>
                      <span className="text-xs text-gray-500">
                        C: {deal.closer}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-sm uppercase tracking-wide border ${getStatusStyles(deal.status)}`}>

                      {deal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deal.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-gray-400 hover:text-black transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>);

}