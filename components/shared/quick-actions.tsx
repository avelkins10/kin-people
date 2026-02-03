"use client";

import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  color: string;
  href?: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

export function QuickActions({
  actions,
  title = "Quick Actions",
}: QuickActionsProps) {
  return (
    <div className="bg-[#0a0a0a] text-white p-6 rounded-sm">
      <h3 className="text-lg font-extrabold tracking-tight mb-6 uppercase">
        {title}
      </h3>
      <div className="space-y-3">
        {actions.map((action) => {
          const content = (
            <>
              <div className="flex items-center gap-3">
                <action.icon className={`w-4 h-4 ${action.color}`} />
                <span className="font-bold text-sm">{action.label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </>
          );

          if (action.href) {
            return (
              <Link
                key={action.label}
                href={action.href}
                className="w-full text-left p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-between group"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className="w-full text-left p-4 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-between group"
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
