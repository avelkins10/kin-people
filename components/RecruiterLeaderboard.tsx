import React from 'react';
import { Trophy } from 'lucide-react';
const recruiters = [
{
  id: 1,
  name: 'Sarah Jenkins',
  hires: 8,
  avatar: 'SJ'
},
{
  id: 2,
  name: 'Mike Ross',
  hires: 6,
  avatar: 'MR'
},
{
  id: 3,
  name: 'Alex Doe',
  hires: 4,
  avatar: 'AD'
}];

export function RecruiterLeaderboard() {
  return (
    <div className="bg-white border border-gray-100 p-6 rounded-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-extrabold tracking-tight text-black uppercase">
          Top Recruiters
        </h3>
        <Trophy className="w-5 h-5 text-indigo-600" />
      </div>

      <div className="space-y-4">
        {recruiters.map((recruiter, index) =>
        <div
          key={recruiter.id}
          className="flex items-center justify-between group">

            <div className="flex items-center gap-3">
              <div
              className={`
                w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full
                ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-800'}
              `}>

                {index + 1}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {recruiter.avatar}
                </div>
                <span className="font-bold text-sm text-black">
                  {recruiter.name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="block font-extrabold text-indigo-600">
                {recruiter.hires}
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-400">
                Hires
              </span>
            </div>
          </div>
        )}
      </div>
    </div>);

}