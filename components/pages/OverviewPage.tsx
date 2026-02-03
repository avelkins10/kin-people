"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/MetricCard';
import { HiringVelocitySparkline } from '@/components/HiringVelocitySparkline';
import { RecruiterActivityFeed } from '@/components/RecruiterActivityFeed';
import {
  Users,
  UserPlus,
  GraduationCap,
  Clock,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  ChevronRight } from
'lucide-react';
import { useModals } from '@/components/ModalsContext';
// Mini pipeline funnel data
const pipelineStages = [
{
  name: 'Lead',
  count: 12,
  color: 'bg-gray-400'
},
{
  name: 'Contacted',
  count: 8,
  color: 'bg-blue-400'
},
{
  name: 'Interviewing',
  count: 5,
  color: 'bg-indigo-500'
},
{
  name: 'Offer Sent',
  count: 3,
  color: 'bg-purple-500'
},
{
  name: 'Agreement',
  count: 2,
  color: 'bg-pink-500'
},
{
  name: 'Onboarding',
  count: 4,
  color: 'bg-amber-500'
}];

// Recent hires for onboarding preview
const recentHires = [
{
  name: 'Stanley Hudson',
  daysIn: 5,
  progress: 33,
  office: 'Phoenix HQ'
},
{
  name: 'Phyllis Vance',
  daysIn: 13,
  progress: 83,
  office: 'Phoenix HQ'
},
{
  name: 'Ryan Howard',
  daysIn: 1,
  progress: 0,
  office: 'Phoenix HQ'
}];

export function OverviewPage() {
  const { openAddRecruit, navigateTo } = useModals();
  const maxCount = Math.max(...pipelineStages.map((s) => s.count));
  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Recruiting & Onboarding
          </h1>
          <p className="text-gray-500 font-medium">
            Build your sales team from lead to field-ready rep.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={openAddRecruit}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Recruit
          </Button>
          <Button onClick={() => navigateTo('onboarding')}>
            <GraduationCap className="w-4 h-4 mr-2" />
            View Onboarding
          </Button>
        </div>
      </header>

      {/* Alerts */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm mb-8 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-sm">
            3 Items Need Attention
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            2 recruits stuck in pipeline &gt;5 days • 1 onboarding rep blocked
          </p>
        </div>
        <button
          onClick={() => navigateTo('recruiting')}
          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center whitespace-nowrap">

          View All <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>

      {/* Top Metrics - Recruiting & Onboarding focused */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <MetricCard
          label="Active Recruits"
          value="28"
          icon={UserPlus}
          trend="+5 this week"
          trendUp={true} />

        <MetricCard
          label="Conversion Rate"
          value="34%"
          icon={TrendingUp}
          trend="Lead → Hired"
          trendUp={true} />

        <MetricCard
          label="In Onboarding"
          value="12"
          icon={GraduationCap}
          trend="Avg 14 days"
          trendUp={true} />

        <MetricCard
          label="Avg Time to Hire"
          value="18 days"
          icon={Clock}
          trend="-3 days vs last month"
          trendUp={true} />

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pipeline Funnel */}
          <div className="bg-white p-6 border border-gray-100 rounded-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold tracking-tight text-black uppercase">
                Recruiting Pipeline
              </h3>
              <button
                onClick={() => navigateTo('recruiting')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide flex items-center">

                View Full Pipeline <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>
            <div className="space-y-3">
              {pipelineStages.map((stage) =>
              <div key={stage.name} className="flex items-center gap-4">
                  <div className="w-24 text-xs font-bold text-gray-500 uppercase tracking-wide shrink-0">
                    {stage.name}
                  </div>
                  <div className="flex-1 h-8 bg-gray-50 rounded-sm overflow-hidden relative">
                    <div
                    className={`h-full ${stage.color} transition-all duration-500`}
                    style={{
                      width: `${stage.count / maxCount * 100}%`
                    }} />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-700">
                      {stage.count}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-2xl font-extrabold text-black">34</span>
                  <span className="text-xs font-bold text-gray-400 uppercase ml-2">
                    Total in Pipeline
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-100" />
                <div className="flex items-center gap-2">
                  <HiringVelocitySparkline />
                  <span className="text-xs font-bold text-green-600">+12%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Onboarding Preview */}
          <div className="bg-white p-6 border border-gray-100 rounded-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold tracking-tight text-black uppercase">
                Onboarding Progress
              </h3>
              <button
                onClick={() => navigateTo('onboarding')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide flex items-center">

                View All <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>
            <div className="space-y-4">
              {recentHires.map((hire) =>
              <div
                key={hire.name}
                onClick={() => navigateTo('onboarding')}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-sm hover:bg-gray-100 transition-colors cursor-pointer group">

                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {hire.name.
                  split(' ').
                  map((n) => n[0]).
                  join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {hire.name}
                      </span>
                      <span className="text-xs font-bold text-indigo-600">
                        {hire.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${hire.progress}%`
                      }} />

                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-500">
                        {hire.office}
                      </span>
                      <span
                      className={`text-[10px] font-bold ${hire.daysIn > 10 ? 'text-red-500' : 'text-gray-400'}`}>

                        Day {hire.daysIn}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-xl font-extrabold text-black">3</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Starting Soon
                </span>
              </div>
              <div>
                <span className="text-xl font-extrabold text-black">12</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  In Training
                </span>
              </div>
              <div>
                <span className="text-xl font-extrabold text-green-600">4</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  Field Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Activity Feed */}
          <RecruiterActivityFeed />

          {/* Quick Actions - Recruiting & Onboarding focused */}
          <div className="bg-[#0a0a0a] text-white p-6 rounded-sm">
            <h3 className="text-lg font-extrabold tracking-tight mb-6 uppercase">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={openAddRecruit}
                className="w-full text-left p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-between group">

                <div className="flex items-center gap-3">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-sm">Add New Recruit</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>
              <button
                onClick={() => navigateTo('recruiting')}
                className="w-full text-left p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-between group">

                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-sm">Convert to Person</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>
              <button
                onClick={() => navigateTo('onboarding')}
                className="w-full text-left p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-between group">

                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm">Schedule Training</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>
              <button
                onClick={() => navigateTo('people')}
                className="w-full text-left p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-between group">

                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-sm">Assign Mentor</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>);

}