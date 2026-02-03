import React from 'react';
import { Filter, X } from 'lucide-react';
export function PipelineFilters() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border border-gray-100 rounded-sm mb-6">
      <div className="flex items-center gap-2 text-gray-500 mr-2">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wide">
          Filters
        </span>
      </div>

      <div className="flex flex-wrap gap-3 flex-1">
        {/* Recruiter Filter */}
        <div className="relative">
          <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 pl-3 pr-8 rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors">
            <option>Recruiter: All</option>
            <option>Sarah Jenkins</option>
            <option>Mike Ross</option>
            <option>Alex Doe</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20">

              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        {/* Office Filter */}
        <div className="relative">
          <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 pl-3 pr-8 rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors">
            <option>Office: All</option>
            <option>Phoenix HQ</option>
            <option>Denver</option>
            <option>Austin</option>
            <option>Dallas</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20">

              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 pl-3 pr-8 rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors">
            <option>Priority: All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20">

              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        {/* Source Filter */}
        <div className="relative">
          <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 pl-3 pr-8 rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors">
            <option>Source: All</option>
            <option>Referral</option>
            <option>Indeed</option>
            <option>LinkedIn</option>
            <option>Direct</option>
            <option>ZipRecruiter</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20">

              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      <button className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors uppercase tracking-wide">
        <X className="w-3 h-3" />
        Clear Filters
      </button>
    </div>);

}