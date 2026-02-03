import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";

interface AlertBannerProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function AlertBanner({
  title,
  description,
  actionLabel = "View All",
  actionHref,
}: AlertBannerProps) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      {actionHref && (
        <Link
          href={actionHref}
          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center whitespace-nowrap"
        >
          {actionLabel} <ChevronRight className="w-3 h-3 ml-1" />
        </Link>
      )}
    </div>
  );
}
