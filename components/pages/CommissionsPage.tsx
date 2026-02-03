"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/MetricCard';
import {
  DollarSign,
  Briefcase,
  Calendar,
  Download,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle } from
'lucide-react';
type CommissionStatus = 'Pending' | 'Approved' | 'Paid' | 'Held' | 'Void';
type CommissionType = 'Setter' | 'Closer' | 'Self Gen' | 'Override';
interface Commission {
  id: string;
  person: string;
  dealRef: string;
  type: CommissionType;
  amount: string;
  status: CommissionStatus;
  date: string;
}
const commissions: Commission[] = [
{
  id: '1',
  person: 'Sarah Jenkins',
  dealRef: 'Smith - Solar 8.4kW',
  type: 'Closer',
  amount: '$2,450.00',
  status: 'Approved',
  date: 'Oct 24, 2023'
},
{
  id: '2',
  person: 'James Chen',
  dealRef: 'Smith - Solar 8.4kW',
  type: 'Setter',
  amount: '$850.00',
  status: 'Approved',
  date: 'Oct 24, 2023'
},
{
  id: '3',
  person: 'Mike Ross',
  dealRef: 'Team Override - Oct',
  type: 'Override',
  amount: '$1,240.00',
  status: 'Pending',
  date: 'Oct 25, 2023'
},
{
  id: '4',
  person: 'Emily Davis',
  dealRef: 'Wilson - Solar 12.2kW',
  type: 'Setter',
  amount: '$1,100.00',
  status: 'Paid',
  date: 'Oct 15, 2023'
},
{
  id: '5',
  person: 'James Chen',
  dealRef: 'Brown - Solar 6.8kW',
  type: 'Self Gen',
  amount: '$3,200.00',
  status: 'Pending',
  date: 'Oct 20, 2023'
}];

export function CommissionsPage() {
  const getStatusStyles = (status: CommissionStatus) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Approved':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Held':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Void':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  const getStatusIcon = (status: CommissionStatus) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'Approved':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'Pending':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'Held':
        return <AlertCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };
  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Commissions & Payroll
          </h1>
          <p className="text-gray-500 font-medium">
            Track earnings, approve payouts, and manage payroll.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Payroll
          </Button>
          <Button>
            <DollarSign className="w-4 h-4 mr-2" />
            Run Payroll
          </Button>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <MetricCard
          label="Pending Payout"
          value="$12,450"
          icon={Clock}
          trend="Next cycle"
          trendUp={true} />

        <MetricCard
          label="Approved"
          value="$8,200"
          icon={CheckCircle}
          trend="Ready to pay"
          trendUp={true} />

        <MetricCard
          label="Paid YTD"
          value="$145.2k"
          icon={DollarSign}
          trend="+24% vs last year"
          trendUp={true} />

        <MetricCard
          label="Next Payroll"
          value="Nov 1"
          icon={Calendar}
          trend="In 5 days"
          trendUp={true} />

      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button className="px-6 py-3 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 uppercase tracking-wide">
          All Commissions
        </button>
        <button className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-200 transition-colors uppercase tracking-wide">
          My Earnings
        </button>
        <button className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-200 transition-colors uppercase tracking-wide">
          Team Overrides
        </button>
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
          <option>Pending</option>
          <option>Approved</option>
          <option>Paid</option>
        </select>
        <select className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide">
          <option>Type: All</option>
          <option>Setter</option>
          <option>Closer</option>
          <option>Override</option>
        </select>
        <select className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide">
          <option>Person: All</option>
          <option>Sarah Jenkins</option>
          <option>James Chen</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Person
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Deal Reference
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Amount
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
              {commissions.map((comm) =>
              <tr
                key={comm.id}
                className="hover:bg-gray-50 transition-colors group">

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-black">{comm.person}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {comm.dealRef}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      {comm.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-black">
                      {comm.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-sm uppercase tracking-wide border flex items-center w-fit ${getStatusStyles(comm.status)}`}>

                      {getStatusIcon(comm.status)}
                      {comm.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comm.date}
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