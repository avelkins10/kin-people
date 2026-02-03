"use client";

import React, { useState } from 'react';
import { PipelineMetrics } from '@/components/PipelineMetrics';
import { PipelineFilters } from '@/components/PipelineFilters';
import { PipelineBoard } from '@/components/PipelineBoard';
import { PipelineListView } from '@/components/PipelineListView';
import { NeedsActionAlert } from '@/components/NeedsActionAlert';
import { Button } from '@/components/ui/button';
import { Plus, Send, UserCheck, LayoutGrid, List } from 'lucide-react';
import { useModals } from '@/components/ModalsContext';
import { Candidate } from '@/components/CandidateCard';
// Shared candidate data for both views
const candidatesData: {
  stage: string;
  stageLabel: string;
  items: Candidate[];
}[] = [
{
  stage: 'lead',
  stageLabel: 'Lead',
  items: [
  {
    id: '1',
    name: 'Sarah Miller',
    targetRole: 'Sales Rep',
    targetOffice: 'Phoenix HQ',
    recruiterName: 'Mike Ross',
    recruiterInitials: 'MR',
    source: 'LinkedIn',
    priority: 'high',
    daysInStage: 2
  },
  {
    id: '2',
    name: 'James Chen',
    targetRole: 'Sales Rep',
    targetOffice: 'Denver',
    recruiterName: 'Sarah Jenkins',
    recruiterInitials: 'SJ',
    source: 'Indeed',
    priority: 'medium',
    daysInStage: 1
  },
  {
    id: '3',
    name: 'Emily Davis',
    targetRole: 'Team Lead',
    targetOffice: 'Austin',
    recruiterName: 'Alex Doe',
    recruiterInitials: 'AD',
    source: 'Referral',
    priority: 'high',
    daysInStage: 4
  }]

},
{
  stage: 'contacted',
  stageLabel: 'Contacted',
  items: [
  {
    id: '4',
    name: 'Michael Scott',
    targetRole: 'Manager',
    targetOffice: 'Dallas',
    recruiterName: 'Mike Ross',
    recruiterInitials: 'MR',
    source: 'Direct',
    priority: 'medium',
    daysInStage: 6
  },
  {
    id: '5',
    name: 'Dwight Schrute',
    targetRole: 'Sales Rep',
    targetOffice: 'Phoenix HQ',
    recruiterName: 'Sarah Jenkins',
    recruiterInitials: 'SJ',
    source: 'ZipRecruiter',
    priority: 'low',
    daysInStage: 2
  }]

},
{
  stage: 'interviewing',
  stageLabel: 'Interviewing',
  items: [
  {
    id: '6',
    name: 'Jim Halpert',
    targetRole: 'Sales Rep',
    targetOffice: 'Denver',
    recruiterName: 'Alex Doe',
    recruiterInitials: 'AD',
    source: 'Referral',
    priority: 'high',
    daysInStage: 1
  },
  {
    id: '7',
    name: 'Pam Beesly',
    targetRole: 'Sales Rep',
    targetOffice: 'Austin',
    recruiterName: 'Sarah Jenkins',
    recruiterInitials: 'SJ',
    source: 'Indeed',
    priority: 'medium',
    daysInStage: 3
  }]

},
{
  stage: 'offerSent',
  stageLabel: 'Offer Sent',
  items: [
  {
    id: '8',
    name: 'Ryan Howard',
    targetRole: 'Sales Rep',
    targetOffice: 'Phoenix HQ',
    recruiterName: 'Mike Ross',
    recruiterInitials: 'MR',
    source: 'LinkedIn',
    priority: 'high',
    daysInStage: 2
  }]

},
{
  stage: 'agreementSent',
  stageLabel: 'Agreement Sent',
  items: [
  {
    id: '9',
    name: 'Kelly Kapoor',
    targetRole: 'Sales Rep',
    targetOffice: 'Dallas',
    recruiterName: 'Alex Doe',
    recruiterInitials: 'AD',
    source: 'ZipRecruiter',
    priority: 'medium',
    daysInStage: 1
  }]

},
{
  stage: 'agreementSigned',
  stageLabel: 'Agreement Signed',
  items: [
  {
    id: '10',
    name: 'Toby Flenderson',
    targetRole: 'Team Lead',
    targetOffice: 'Denver',
    recruiterName: 'Sarah Jenkins',
    recruiterInitials: 'SJ',
    source: 'Direct',
    priority: 'low',
    daysInStage: 0
  }]

},
{
  stage: 'onboarding',
  stageLabel: 'Onboarding',
  items: [
  {
    id: '11',
    name: 'Stanley Hudson',
    targetRole: 'Sales Rep',
    targetOffice: 'Phoenix HQ',
    recruiterName: 'Mike Ross',
    recruiterInitials: 'MR',
    source: 'Referral',
    priority: 'medium',
    daysInStage: 5
  },
  {
    id: '12',
    name: 'Phyllis Vance',
    targetRole: 'Sales Rep',
    targetOffice: 'Austin',
    recruiterName: 'Sarah Jenkins',
    recruiterInitials: 'SJ',
    source: 'Indeed',
    priority: 'medium',
    daysInStage: 12
  }]

},
{
  stage: 'converted',
  stageLabel: 'Converted',
  items: [
  {
    id: '13',
    name: 'Creed Bratton',
    targetRole: 'Regional Director',
    targetOffice: 'Dallas',
    recruiterName: 'Alex Doe',
    recruiterInitials: 'AD',
    source: 'Direct',
    priority: 'high',
    daysInStage: 1
  }]

}];

type ViewMode = 'kanban' | 'list';
export function Dashboard() {
  const { openAddRecruit } = useModals();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Recruiting Pipeline
          </h1>
          <p className="text-gray-500 font-medium">
            Manage your sales team growth from lead to certified rep.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <UserCheck className="w-4 h-4 mr-2" />
            Convert to Person
          </Button>
          <Button variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Send Agreement
          </Button>
          <Button onClick={openAddRecruit}>
            <Plus className="w-4 h-4 mr-2" />
            Add Recruit
          </Button>
        </div>
      </header>

      {/* Metrics */}
      <PipelineMetrics />

      {/* Alert Section */}
      <div className="shrink-0">
        <NeedsActionAlert />
      </div>

      {/* Filters + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0">
        <div className="flex-1">
          <PipelineFilters />
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-white border border-gray-100 rounded-sm p-1 h-fit self-start sm:self-center">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-all ${viewMode === 'kanban' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}>

            <LayoutGrid className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-all ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}>

            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {/* Content - Kanban or List */}
      <div className="flex-1 min-h-0">
        {viewMode === 'kanban' ?
        <PipelineBoard /> :

        <PipelineListView candidates={candidatesData} />
        }
      </div>
    </>);

}