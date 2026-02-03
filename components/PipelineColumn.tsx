import React from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Candidate, CandidateCard } from '@/components/CandidateCard';
interface PipelineColumnProps {
  title: string;
  icon: React.ElementType;
  count: number;
  candidates: Candidate[];
  color?: string;
}
export function PipelineColumn({
  title,
  icon: Icon,
  count,
  candidates,
  color = 'text-gray-500'
}: PipelineColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0 h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <h3 className="font-extrabold text-sm uppercase tracking-tight text-gray-900">
            {title}
          </h3>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-sm">
            {count}
          </span>
        </div>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-gray-100 rounded-sm text-gray-400 hover:text-black transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded-sm text-gray-400 hover:text-black transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 bg-gray-50/50 rounded-sm p-2 space-y-3 overflow-y-auto min-h-[500px]">
        {candidates.map((candidate) =>
        <CandidateCard key={candidate.id} candidate={candidate} />
        )}

        {candidates.length === 0 &&
        <div className="h-24 border-2 border-dashed border-gray-200 rounded-sm flex items-center justify-center text-gray-400 text-xs font-medium">
            No candidates
          </div>
        }
      </div>
    </div>);

}