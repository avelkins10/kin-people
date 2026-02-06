'use client';

import React from 'react';
import {
  Mail,
  CheckCircle,
  UserPlus,
  FileText,
  LucideIcon,
} from 'lucide-react';
import { useFeed, FeedItem } from '@/hooks/use-dashboard-data';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface EventConfig {
  message: (item: FeedItem) => string;
  icon: LucideIcon;
  color: string;
}

const EVENT_CONFIG: Record<string, EventConfig> = {
  lead: {
    message: (item) =>
      item.actorName
        ? `${item.actorName} added ${item.subjectName} as a recruit`
        : `${item.subjectName} was added as a recruit`,
    icon: UserPlus,
    color: 'rgb(129, 140, 248)', // indigo
  },
  offer_sent: {
    message: (item) => `${item.subjectName} received an offer`,
    icon: Mail,
    color: 'rgb(168, 85, 247)', // purple
  },
  agreement_signed: {
    message: (item) => `${item.subjectName} signed their agreement!`,
    icon: FileText,
    color: 'rgb(74, 222, 128)', // green
  },
  hired: {
    message: (item) => `${item.subjectName} has been hired!`,
    icon: CheckCircle,
    color: 'rgb(74, 222, 128)', // green
  },
  onboarding_completed: {
    message: (item) => `${item.subjectName} completed onboarding!`,
    icon: CheckCircle,
    color: 'rgb(74, 222, 128)', // green
  },
};

const DEFAULT_CONFIG: EventConfig = {
  message: (item) => `${item.subjectName} — ${item.event}`,
  icon: CheckCircle,
  color: 'rgb(156, 163, 175)',
};

export function RecruiterActivityFeed() {
  const { data, isLoading } = useFeed();
  const items = data?.items ?? [];

  return (
    <div className="bg-[#0a0a0a] text-white p-6 rounded-sm h-full min-h-[350px] flex flex-col" style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      <h3 className="text-lg font-extrabold tracking-tight mb-6 uppercase" style={{ color: '#ffffff' }}>
        Live Feed
      </h3>
      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="mt-1 w-7 h-7 rounded-full bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-white/10 rounded w-3/4" />
                <div className="h-2.5 bg-white/5 rounded w-1/4" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No activity yet</p>
        ) : (
          items.map((item) => {
            const config = EVENT_CONFIG[item.event] ?? DEFAULT_CONFIG;
            const Icon = config.icon;
            return (
              <div key={item.id} className="flex items-start gap-3 group">
                <div
                  className="mt-1 p-1.5 rounded-full bg-white/5 border border-white/10"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: config.color }}
                >
                  <Icon className="w-3 h-3" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight text-gray-400" style={{ color: 'rgb(156, 163, 175)' }}>
                    {config.message(item)}
                  </p>
                  <span className="text-xs text-gray-600 font-mono mt-1 block" style={{ color: 'rgb(75, 85, 99)' }}>
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
