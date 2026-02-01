import { getPersonHistory } from "@/lib/db/helpers/person-helpers";

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

interface PersonTimelineProps {
  personId: string;
}

export async function PersonTimeline({ personId }: PersonTimelineProps) {
  const history = await getPersonHistory(personId);

  function getChangeTypeLabel(changeType: string): string {
    const labels: Record<string, string> = {
      hired: "Hired",
      role_change: "Role Change",
      office_change: "Office Change",
      reports_to_change: "Manager Change",
      pay_plan_change: "Pay Plan Change",
      team_join: "Joined Team",
      team_leave: "Left Team",
      setter_tier_change: "Setter Tier Change",
      terminated: "Terminated",
    };
    return labels[changeType] || changeType;
  }

  function getChangeTypeColor(changeType: string): string {
    switch (changeType) {
      case "hired":
        return "bg-green-500";
      case "terminated":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  }

  function renderChangeDetails(historyItem: typeof history[0]) {
    const { history: h } = historyItem;
    const prevValue = h.previousValue as any;
    const newValue = h.newValue as any;

    switch (h.changeType) {
      case "hired":
        return (
          <div className="text-sm text-gray-600">
            {newValue.role_name && <p>Role: {newValue.role_name}</p>}
            {newValue.office_name && <p>Office: {newValue.office_name}</p>}
            {newValue.pay_plan_name && <p>Pay Plan: {newValue.pay_plan_name}</p>}
            {newValue.manager_name && <p>Manager: {newValue.manager_name}</p>}
            {newValue.recruiter_name && <p>Recruited by: {newValue.recruiter_name}</p>}
          </div>
        );
      case "role_change":
        return (
          <div className="text-sm text-gray-600">
            <p>
              {prevValue?.role_name || "Unknown"} → {newValue?.role_name || "Unknown"}
            </p>
          </div>
        );
      case "office_change":
        return (
          <div className="text-sm text-gray-600">
            <p>
              {prevValue?.office_name || "Unknown"} → {newValue?.office_name || "Unknown"}
            </p>
          </div>
        );
      case "reports_to_change":
        return (
          <div className="text-sm text-gray-600">
            <p>
              {prevValue?.manager_name || "None"} → {newValue?.manager_name || "None"}
            </p>
          </div>
        );
      case "pay_plan_change":
        return (
          <div className="text-sm text-gray-600">
            <p>
              {prevValue?.pay_plan_name || "Unknown"} → {newValue?.pay_plan_name || "Unknown"}
            </p>
          </div>
        );
      case "team_join":
        return (
          <div className="text-sm text-gray-600">
            <p>Joined: {newValue?.team_name || "Unknown"}</p>
            {newValue?.role_in_team && <p>Role: {newValue.role_in_team}</p>}
          </div>
        );
      case "team_leave":
        return (
          <div className="text-sm text-gray-600">
            <p>Left: {prevValue?.team_name || "Unknown"}</p>
          </div>
        );
      case "setter_tier_change":
        return (
          <div className="text-sm text-gray-600">
            <p>
              {prevValue?.setter_tier || "Unknown"} → {newValue?.setter_tier || "Unknown"}
            </p>
          </div>
        );
      case "terminated":
        return (
          <div className="text-sm text-gray-600">
            {newValue?.termination_date && (
              <p>Termination Date: {formatDate(newValue.termination_date)}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  if (history.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No history records found
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {history.map((item, index) => {
          const { history: h } = item;
          return (
            <div key={h.id} className="relative flex gap-4">
              <div
                className={`relative z-10 h-8 w-8 rounded-full ${getChangeTypeColor(
                  h.changeType
                )} flex items-center justify-center text-white text-xs font-medium`}
              >
                {index + 1}
              </div>
              <div className="flex-1 pb-6">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {getChangeTypeLabel(h.changeType)}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(h.effectiveDate)}
                        </span>
                      </div>
                      {renderChangeDetails(item)}
                      {h.reason && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium text-gray-700">Reason:</p>
                          <p className="text-gray-600">{h.reason}</p>
                        </div>
                      )}
                    </div>
                    {item.changedBy && (
                      <div className="text-right text-xs text-gray-500">
                        <p>Changed by</p>
                        <p className="font-medium">
                          {item.changedBy.firstName} {item.changedBy.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
