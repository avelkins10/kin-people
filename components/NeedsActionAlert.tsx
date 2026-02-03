import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
export function NeedsActionAlert() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ backgroundColor: 'rgb(255, 251, 235)', borderLeftColor: 'rgb(245, 158, 11)' }}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-full shrink-0" style={{ backgroundColor: 'rgb(254, 243, 199)' }}>
          <AlertTriangle className="w-5 h-5 text-amber-600" style={{ color: 'rgb(217, 119, 6)' }} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900" style={{ color: 'rgb(17, 24, 39)' }}>
            3 Candidates require attention
          </h3>
          <p className="text-sm text-gray-600 mt-1" style={{ color: 'rgb(75, 85, 99)' }}>
            2 candidates stuck in "Phone Screen" for &gt;5 days, 1 offer
            expiring soon.
          </p>
        </div>
      </div>
      <button className="text-sm font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 whitespace-nowrap group" style={{ color: 'rgb(180, 83, 9)' }}>
        View Action Items
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>);

}