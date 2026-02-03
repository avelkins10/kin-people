import React from 'react';
import { Clock, MapPin, User, AlertCircle } from 'lucide-react';
export interface Candidate {
  id: string;
  name: string;
  targetRole: 'Sales Rep' | 'Team Lead' | 'Manager' | 'Regional Director';
  targetOffice: string;
  recruiterName: string;
  recruiterInitials: string;
  source: 'Referral' | 'Indeed' | 'LinkedIn' | 'Direct' | 'ZipRecruiter';
  priority: 'high' | 'medium' | 'low';
  daysInStage: number;
}
interface CandidateCardProps {
  candidate: Candidate;
}
export function CandidateCard({ candidate }: CandidateCardProps) {
  const isStale = candidate.daysInStage > 5;
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
    <div className="bg-white border border-gray-200 p-4 rounded-sm shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden">
      {/* Stale Indicator */}
      {isStale &&
      <div
        className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl-sm z-10"
        title="Stale: >5 days in stage" />

      }

      {/* Header: Name & Priority */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-sm text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors truncate pr-2">
          {candidate.name}
        </h4>
        <span
          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm border ${getPriorityColor(candidate.priority)}`}>

          {candidate.priority}
        </span>
      </div>

      {/* Role & Office */}
      <div className="mb-3 space-y-1">
        <p className="text-xs font-medium text-gray-700">
          {candidate.targetRole}
        </p>
        <div className="flex items-center text-xs text-gray-500">
          <MapPin className="w-3 h-3 mr-1" />
          {candidate.targetOffice}
        </div>
      </div>

      {/* Footer: Recruiter, Source, Days */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold"
            title={`Recruiter: ${candidate.recruiterName}`}>

            {candidate.recruiterInitials}
          </div>
          <span
            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm border ${getSourceColor(candidate.source)}`}>

            {candidate.source}
          </span>
        </div>

        <div
          className={`flex items-center text-xs font-bold ${isStale ? 'text-red-600' : 'text-gray-400'}`}>

          <Clock className="w-3 h-3 mr-1" />
          {candidate.daysInStage}d
        </div>
      </div>
    </div>);

}