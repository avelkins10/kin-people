import React from 'react';
import {
  Clock,
  MapPin,
  MoreHorizontal,
  ArrowUpDown,
  ChevronUp,
  ChevronDown } from
'lucide-react';
import { Candidate } from '@/components/CandidateCard';
interface PipelineListViewProps {
  candidates: {
    stage: string;
    stageLabel: string;
    items: Candidate[];
  }[];
}
export function PipelineListView({ candidates }: PipelineListViewProps) {
  // Flatten all candidates with their stage info
  const allCandidates = candidates.flatMap((stage) =>
  stage.items.map((candidate) => ({
    ...candidate,
    stage: stage.stage,
    stageLabel: stage.stageLabel
  }))
  );
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'contacted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'interviewing':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'offerSent':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'agreementSent':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'agreementSigned':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'onboarding':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'converted':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Referral':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'LinkedIn':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Indeed':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'ZipRecruiter':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };
  return (
    <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                <button className="flex items-center gap-1 hover:text-black transition-colors">
                  Name
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                <button className="flex items-center gap-1 hover:text-black transition-colors">
                  Status
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Target Role
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Office
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Recruiter
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                <button className="flex items-center gap-1 hover:text-black transition-colors">
                  Days
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allCandidates.map((candidate) => {
              const isStale = candidate.daysInStage > 5;
              return (
                <tr
                  key={candidate.id}
                  className="hover:bg-gray-50 transition-colors group">

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {candidate.name.
                        split(' ').
                        map((n) => n[0]).
                        join('')}
                      </div>
                      <span className="font-bold text-black group-hover:text-indigo-600 transition-colors">
                        {candidate.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-sm uppercase tracking-wide border ${getStageColor(candidate.stage)}`}>

                      {candidate.stageLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-700">
                      {candidate.targetRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-1.5 text-gray-400" />
                      {candidate.targetOffice}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                        {candidate.recruiterInitials}
                      </div>
                      <span className="text-sm text-gray-600">
                        {candidate.recruiterName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase tracking-wide border ${getSourceColor(candidate.source)}`}>

                      {candidate.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase tracking-wide border ${getPriorityColor(candidate.priority)}`}>

                      {candidate.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`flex items-center text-sm font-bold ${isStale ? 'text-red-600' : 'text-gray-500'}`}>

                      <Clock className="w-3 h-3 mr-1" />
                      {candidate.daysInStage}d
                      {isStale &&
                      <span className="ml-2 w-2 h-2 bg-red-500 rounded-full" />
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-gray-400 hover:text-black transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase">
          {allCandidates.length} Recruits Total
        </span>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            {allCandidates.filter((c) => c.daysInStage > 5).length} Stale
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            {allCandidates.filter((c) => c.priority === 'high').length} High
            Priority
          </span>
        </div>
      </div>
    </div>);

}