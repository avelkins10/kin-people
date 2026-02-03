import React from 'react';
import {
  UserPlus,
  Phone,
  MessageSquare,
  FileText,
  Send,
  FileCheck,
  GraduationCap,
  Award } from
'lucide-react';
import { PipelineColumn } from '@/components/PipelineColumn';
import { Candidate } from '@/components/CandidateCard';
// Updated Mock Data for 8 Stages
const candidates: Record<string, Candidate[]> = {
  lead: [
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
  }],

  contacted: [
  {
    id: '4',
    name: 'Michael Scott',
    targetRole: 'Manager',
    targetOffice: 'Dallas',
    recruiterName: 'Mike Ross',
    recruiterInitials: 'MR',
    source: 'Direct',
    priority: 'medium',
    daysInStage: 6 // Stale
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
  }],

  interviewing: [
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
  }],

  offerSent: [
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
  }],

  agreementSent: [
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
  }],

  agreementSigned: [
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
  }],

  onboarding: [
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
    daysInStage: 12 // Stale
  }],

  converted: [
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

};
export function PipelineBoard() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-420px)] min-h-[500px]">
      <PipelineColumn
        title="Lead"
        icon={UserPlus}
        count={candidates.lead.length}
        candidates={candidates.lead}
        color="text-gray-500" />

      <PipelineColumn
        title="Contacted"
        icon={Phone}
        count={candidates.contacted.length}
        candidates={candidates.contacted}
        color="text-blue-500" />

      <PipelineColumn
        title="Interviewing"
        icon={MessageSquare}
        count={candidates.interviewing.length}
        candidates={candidates.interviewing}
        color="text-indigo-500" />

      <PipelineColumn
        title="Offer Sent"
        icon={FileText}
        count={candidates.offerSent.length}
        candidates={candidates.offerSent}
        color="text-purple-500" />

      <PipelineColumn
        title="Agreement Sent"
        icon={Send}
        count={candidates.agreementSent.length}
        candidates={candidates.agreementSent}
        color="text-pink-500" />

      <PipelineColumn
        title="Agreement Signed"
        icon={FileCheck}
        count={candidates.agreementSigned.length}
        candidates={candidates.agreementSigned}
        color="text-emerald-500" />

      <PipelineColumn
        title="Onboarding"
        icon={GraduationCap}
        count={candidates.onboarding.length}
        candidates={candidates.onboarding}
        color="text-amber-500" />

      <PipelineColumn
        title="Converted"
        icon={Award}
        count={candidates.converted.length}
        candidates={candidates.converted}
        color="text-green-600" />

    </div>);

}