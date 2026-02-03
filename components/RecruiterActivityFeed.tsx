import React from 'react';
import {
  MessageSquare,
  Mail,
  CheckCircle,
  UserPlus,
  FileText } from
'lucide-react';
const activities = [
{
  id: 1,
  user: 'Sarah J.',
  action: 'moved John to Interview',
  time: '2m ago',
  icon: UserPlus,
  color: 'text-indigo-400'
},
{
  id: 2,
  user: 'Mike R.',
  action: 'sent offer to Lisa M.',
  time: '15m ago',
  icon: Mail,
  color: 'text-green-400'
},
{
  id: 3,
  user: 'Sarah J.',
  action: 'added interview notes',
  time: '1h ago',
  icon: FileText,
  color: 'text-gray-400'
},
{
  id: 4,
  user: 'System',
  action: 'new application: Senior Tech',
  time: '2h ago',
  icon: MessageSquare,
  color: 'text-indigo-400'
},
{
  id: 5,
  user: 'Alex D.',
  action: 'hired Marcus T.',
  time: '3h ago',
  icon: CheckCircle,
  color: 'text-green-400'
}];

export function RecruiterActivityFeed() {
  const getColorStyle = (color: string) => {
    const colorMap: Record<string, string> = {
      'text-indigo-400': 'rgb(129, 140, 248)',
      'text-green-400': 'rgb(74, 222, 128)',
      'text-gray-400': 'rgb(156, 163, 175)',
    };
    return colorMap[color] || 'rgb(156, 163, 175)';
  };

  return (
    <div className="bg-[#0a0a0a] text-white p-6 rounded-sm h-full min-h-[350px] flex flex-col" style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      <h3 className="text-lg font-extrabold tracking-tight mb-6 uppercase" style={{ color: '#ffffff' }}>
        Live Feed
      </h3>
      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {activities.map((item) =>
        <div key={item.id} className="flex items-start gap-3 group">
            <div
            className={`mt-1 p-1.5 rounded-full bg-white/5 border border-white/10 ${item.color}`}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: getColorStyle(item.color) }}>

              <item.icon className="w-3 h-3" />
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">
                <span className="font-bold text-white" style={{ color: '#ffffff' }}>{item.user}</span>{' '}
                <span className="text-gray-400" style={{ color: 'rgb(156, 163, 175)' }}>{item.action}</span>
              </p>
              <span className="text-xs text-gray-600 font-mono mt-1 block" style={{ color: 'rgb(75, 85, 99)' }}>
                {item.time}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>);

}
