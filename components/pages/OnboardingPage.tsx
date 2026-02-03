"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/MetricCard';
import {
  GraduationCap,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Shield,
  MoreHorizontal,
  ChevronRight } from
'lucide-react';
interface OnboardingTask {
  id: string;
  label: string;
  completed: boolean;
}
interface OnboardingRep {
  id: string;
  name: string;
  hireDate: string;
  manager: string;
  office: string;
  team: string;
  setterTier: 'Rookie' | 'Veteran';
  checklist: OnboardingTask[];
  daysInOnboarding: number;
  avatar?: string;
}
const reps: OnboardingRep[] = [
{
  id: '1',
  name: 'Stanley Hudson',
  hireDate: 'Oct 20, 2023',
  manager: 'Michael Scott',
  office: 'Phoenix HQ',
  team: 'Team Alpha',
  setterTier: 'Rookie',
  daysInOnboarding: 5,
  checklist: [
  {
    id: '1',
    label: 'Equipment Issued',
    completed: true
  },
  {
    id: '2',
    label: 'Product Training',
    completed: true
  },
  {
    id: '3',
    label: 'Sales Scripts',
    completed: false
  },
  {
    id: '4',
    label: 'Compliance Docs',
    completed: false
  },
  {
    id: '5',
    label: 'Ride-Alongs',
    completed: false
  },
  {
    id: '6',
    label: 'First Appointment',
    completed: false
  }]

},
{
  id: '2',
  name: 'Phyllis Vance',
  hireDate: 'Oct 12, 2023',
  manager: 'Michael Scott',
  office: 'Phoenix HQ',
  team: 'Team Alpha',
  setterTier: 'Rookie',
  daysInOnboarding: 13,
  checklist: [
  {
    id: '1',
    label: 'Equipment Issued',
    completed: true
  },
  {
    id: '2',
    label: 'Product Training',
    completed: true
  },
  {
    id: '3',
    label: 'Sales Scripts',
    completed: true
  },
  {
    id: '4',
    label: 'Compliance Docs',
    completed: true
  },
  {
    id: '5',
    label: 'Ride-Alongs',
    completed: true
  },
  {
    id: '6',
    label: 'First Appointment',
    completed: false
  }]

},
{
  id: '3',
  name: 'Ryan Howard',
  hireDate: 'Oct 24, 2023',
  manager: 'Michael Scott',
  office: 'Phoenix HQ',
  team: 'Team Alpha',
  setterTier: 'Rookie',
  daysInOnboarding: 1,
  checklist: [
  {
    id: '1',
    label: 'Equipment Issued',
    completed: false
  },
  {
    id: '2',
    label: 'Product Training',
    completed: false
  },
  {
    id: '3',
    label: 'Sales Scripts',
    completed: false
  },
  {
    id: '4',
    label: 'Compliance Docs',
    completed: false
  },
  {
    id: '5',
    label: 'Ride-Alongs',
    completed: false
  },
  {
    id: '6',
    label: 'First Appointment',
    completed: false
  }]

}];

function OnboardingCard({ rep }: {rep: OnboardingRep;}) {
  const completedCount = rep.checklist.filter((t) => t.completed).length;
  const totalCount = rep.checklist.length;
  const progress = Math.round(completedCount / totalCount * 100);
  const isStale = rep.daysInOnboarding > 14;
  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group relative">
      {isStale &&
      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-sm uppercase tracking-wide">
          Stale
        </div>
      }

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shrink-0">
            {rep.name.
            split(' ').
            map((n) => n[0]).
            join('')}
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
              {rep.name}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">Hired {rep.hireDate}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-black">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-xs">
        <div className="flex items-center text-gray-600">
          <Shield className="w-3 h-3 mr-1.5 text-gray-400" />
          {rep.manager}
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="w-3 h-3 mr-1.5 text-gray-400" />
          {rep.office}
        </div>
        <div className="flex items-center text-gray-600">
          <User className="w-3 h-3 mr-1.5 text-gray-400" />
          {rep.team}
        </div>
        <div className="flex items-center">
          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm font-bold uppercase text-[10px]">
            {rep.setterTier}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-1">
          <span className="text-xs font-bold uppercase text-gray-500">
            Progress
          </span>
          <span className="text-xs font-bold text-indigo-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`
            }}>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {rep.checklist.slice(0, 3).map((task) =>
        <div key={task.id} className="flex items-center text-xs">
            <div
            className={`w-4 h-4 rounded-sm border mr-2 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>

              {task.completed && <CheckCircle className="w-3 h-3" />}
            </div>
            <span
            className={
            task.completed ?
            'text-gray-400 line-through' :
            'text-gray-700 font-medium'
            }>

              {task.label}
            </span>
          </div>
        )}
        {rep.checklist.length > 3 &&
        <div className="text-xs text-gray-400 pl-6">
            + {rep.checklist.length - 3} more tasks
          </div>
        }
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div
          className={`flex items-center text-xs font-bold ${isStale ? 'text-red-500' : 'text-gray-400'}`}>

          <Clock className="w-3 h-3 mr-1" />
          {rep.daysInOnboarding} days
        </div>
        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center">
          View Details <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>);

}
export function OnboardingPage() {
  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Onboarding Tracker
          </h1>
          <p className="text-gray-500 font-medium">
            Track new hire progress from agreement to first sale.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <User className="w-4 h-4 mr-2" />
            Assign Mentor
          </Button>
          <Button>
            <GraduationCap className="w-4 h-4 mr-2" />
            Schedule Training
          </Button>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <MetricCard
          label="Agreement Signed"
          value="3"
          icon={CheckCircle}
          trend="Pending Start"
          trendUp={true} />

        <MetricCard
          label="In Onboarding"
          value="12"
          icon={GraduationCap}
          trend="Avg 14 days"
          trendUp={true} />

        <MetricCard
          label="Training Complete"
          value="89%"
          icon={CheckCircle}
          trend="Completion Rate"
          trendUp={true} />

        <MetricCard
          label="Ready for Field"
          value="4"
          icon={User}
          trend="This Week"
          trendUp={true} />

      </div>

      {/* Blocked Alert */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-sm mb-8 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-gray-900 text-sm">
            Action Required: 2 Reps Blocked
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Phyllis Vance has been in onboarding for 13 days. Missing "First
            Appointment".
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reps.map((rep) =>
        <OnboardingCard key={rep.id} rep={rep} />
        )}
      </div>
    </>);

}