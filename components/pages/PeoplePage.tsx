"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/MetricCard';
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Plus,
  Download,
  Filter,
  MoreHorizontal,
  MapPin,
  Shield } from
'lucide-react';
type PersonStatus = 'Active' | 'Onboarding' | 'Inactive' | 'Terminated';
type SetterTier = 'Rookie' | 'Veteran' | 'Team Lead';
interface Person {
  id: string;
  name: string;
  role: string;
  office: string;
  status: PersonStatus;
  setterTier: SetterTier;
  manager: string;
  avatar?: string;
}
const people: Person[] = [
{
  id: '1',
  name: 'Sarah Jenkins',
  role: 'Team Lead',
  office: 'Phoenix HQ',
  status: 'Active',
  setterTier: 'Team Lead',
  manager: 'Mike Ross'
},
{
  id: '2',
  name: 'James Chen',
  role: 'Sales Rep',
  office: 'Denver',
  status: 'Active',
  setterTier: 'Veteran',
  manager: 'Sarah Jenkins'
},
{
  id: '3',
  name: 'Emily Davis',
  role: 'Sales Rep',
  office: 'Austin',
  status: 'Onboarding',
  setterTier: 'Rookie',
  manager: 'Alex Doe'
},
{
  id: '4',
  name: 'Michael Scott',
  role: 'Regional Manager',
  office: 'Dallas',
  status: 'Active',
  setterTier: 'Team Lead',
  manager: '-'
},
{
  id: '5',
  name: 'Dwight Schrute',
  role: 'Sales Rep',
  office: 'Phoenix HQ',
  status: 'Terminated',
  setterTier: 'Veteran',
  manager: 'Michael Scott'
}];

export function PeoplePage() {
  const getStatusStyles = (status: PersonStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Onboarding':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'Terminated':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };
  const getTierStyles = (tier: SetterTier) => {
    switch (tier) {
      case 'Team Lead':
        return 'text-indigo-600 font-extrabold';
      case 'Veteran':
        return 'text-blue-600 font-bold';
      case 'Rookie':
        return 'text-gray-500 font-medium';
      default:
        return 'text-gray-500';
    }
  };
  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Team Management
          </h1>
          <p className="text-gray-500 font-medium">
            Manage your sales reps, managers, and office staff.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
          <Button icon={<Plus className="w-4 h-4" />}>Add Person</Button>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <MetricCard
          label="Total Team"
          value="47"
          icon={Users}
          trend="+3 this month"
          trendUp={true} />

        <MetricCard
          label="Active Reps"
          value="38"
          icon={UserCheck}
          trend="81% of total"
          trendUp={true} />

        <MetricCard
          label="In Onboarding"
          value="6"
          icon={GraduationCap}
          trend="Avg 14 days"
          trendUp={true} />

        <MetricCard
          label="Terminated"
          value="2"
          icon={UserX}
          trend="This month"
          trendUp={false} />

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
          <option>Office: All</option>
          <option>Phoenix HQ</option>
          <option>Denver</option>
        </select>
        <select className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide">
          <option>Role: All</option>
          <option>Sales Rep</option>
          <option>Team Lead</option>
          <option>Manager</option>
        </select>
        <select className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-sm uppercase tracking-wide">
          <option>Status: All</option>
          <option>Active</option>
          <option>Onboarding</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Office
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Setter Tier
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {people.map((person) =>
              <tr
                key={person.id}
                className="hover:bg-gray-50 transition-colors group">

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                        {person.name.
                      split(' ').
                      map((n) => n[0]).
                      join('')}
                      </div>
                      <span className="font-bold text-black">
                        {person.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {person.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {person.office}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-sm uppercase tracking-wide border ${getStatusStyles(person.status)}`}>

                      {person.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                    className={`text-xs uppercase tracking-wide ${getTierStyles(person.setterTier)}`}>

                      {person.setterTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.manager}
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