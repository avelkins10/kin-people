"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStatus, useResendInvite } from "@/hooks/use-people-data";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface PersonAppAccessProps {
  personId: string;
}

export function PersonAppAccess({ personId }: PersonAppAccessProps) {
  const { data: authStatus, isLoading } = useAuthStatus(personId);
  const resendInvite = useResendInvite();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>App Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </CardContent>
      </Card>
    );
  }

  if (!authStatus) return null;

  const statusConfig = {
    not_invited: {
      label: "Not Invited",
      className: "bg-red-100 text-red-800 border-red-200",
    },
    invited: {
      label: "Invite Pending",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    active: {
      label: "Active",
      className: "bg-green-100 text-green-800 border-green-200",
    },
  } as const;

  const config = statusConfig[authStatus.status];
  const showResendButton =
    authStatus.status === "not_invited" || authStatus.status === "invited";

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-500">Status</p>
          <Badge className={config.className}>{config.label}</Badge>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Last Sign In</p>
          <p className="text-base">
            {authStatus.lastSignInAt
              ? formatRelativeTime(authStatus.lastSignInAt)
              : "Never"}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Invited</p>
          <p className="text-base">
            {authStatus.invitedAt ? formatDate(authStatus.invitedAt) : "—"}
          </p>
        </div>
        {showResendButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => resendInvite.mutate(personId)}
            disabled={resendInvite.isPending}
          >
            {resendInvite.isPending
              ? "Sending..."
              : authStatus.status === "not_invited"
                ? "Send Invite"
                : "Resend Invite"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
