"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useOnboardingTasks, useToggleOnboardingTask } from "@/hooks/use-onboarding-data";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Loader2,
  Mail,
  ClipboardList,
  AlertCircle,
  PartyPopper,
} from "lucide-react";

interface PersonalInfoField {
  fieldId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  category: string | null;
  value: string | null;
  submittedAt: string | null;
}

interface PersonalInfoResponse {
  fields: PersonalInfoField[];
  stats: {
    totalFields: number;
    completedFields: number;
    requiredFields: number;
    completedRequired: number;
    isComplete: boolean;
  };
}

interface PersonOnboardingProps {
  personId: string;
  personStatus?: string;
}

export function PersonOnboarding({ personId, personStatus }: PersonOnboardingProps) {
  const { data: onboardingData, isLoading: tasksLoading, error: tasksError } = useOnboardingTasks(personId);
  const toggleTask = useToggleOnboardingTask();
  const queryClient = useQueryClient();
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoResponse | null>(null);
  const [personalInfoLoading, setPersonalInfoLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [completingOnboarding, setCompletingOnboarding] = useState(false);

  useEffect(() => {
    async function fetchPersonalInfo() {
      try {
        const res = await fetch(`/api/people/${personId}/onboarding-info`);
        if (res.ok) {
          const data = await res.json();
          setPersonalInfo(data);
        }
      } catch (error) {
        console.error("Failed to fetch personal info:", error);
      } finally {
        setPersonalInfoLoading(false);
      }
    }

    fetchPersonalInfo();
  }, [personId]);

  const tasks = onboardingData?.tasks ?? [];
  const completedCount = onboardingData?.completedCount ?? 0;
  const totalCount = onboardingData?.totalCount ?? 0;
  const percentComplete = onboardingData?.percentComplete ?? 0;
  const pendingTaskCount = totalCount - completedCount;

  async function handleSendReminder() {
    setSendingReminder(true);
    try {
      const res = await fetch(`/api/people/${personId}/onboarding/send-reminder`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to send reminder");
      }
      toast({
        title: "Reminder sent",
        description: "Email sent successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reminder",
      });
    } finally {
      setSendingReminder(false);
    }
  }

  async function handleCompleteOnboarding() {
    setCompletingOnboarding(true);
    try {
      const res = await fetch(`/api/people/${personId}/onboarding/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to complete onboarding");
      }
      toast({
        title: "Onboarding completed",
        description: "Person status has been changed to active",
      });
      // Invalidate queries to refresh person data
      queryClient.invalidateQueries({ queryKey: ["people", personId] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete onboarding",
      });
    } finally {
      setCompletingOnboarding(false);
    }
  }

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    const category = task.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  // Group personal info by category
  const personalInfoByCategory = personalInfo?.fields.reduce((acc, field) => {
    const cat = field.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(field);
    return acc;
  }, {} as Record<string, PersonalInfoField[]>) ?? {};

  const categoryLabels: Record<string, string> = {
    admin: "Admin / Paperwork",
    training: "Training",
    equipment: "Equipment",
    software: "Software Access",
    personal_info: "Personal Info",
    meeting: "Meetings",
    setup: "Setup",
    other: "Other",
    uniform: "Uniform / Sizing",
    emergency: "Emergency Contact",
    personal: "Personal Info",
    tax: "Tax Info",
    benefits: "Benefits",
  };

  if (personStatus && personStatus !== "onboarding") {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Not in Onboarding</p>
            <p className="text-sm">
              This person is not currently in onboarding status.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasksLoading || personalInfoLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500" aria-busy="true">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        Loading onboarding data...
      </div>
    );
  }

  if (tasksError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-red-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Error loading onboarding data</p>
            <p className="text-sm">
              {tasksError instanceof Error ? tasksError.message : "An error occurred"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Onboarding Progress</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminder}
              disabled={sendingReminder || pendingTaskCount === 0}
            >
              <Mail className="w-4 h-4 mr-2" />
              {sendingReminder ? "Sending..." : "Send Reminder"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-gray-600">
                {completedCount} of {totalCount} tasks completed
              </span>
              <span className="text-sm font-bold text-indigo-600">{percentComplete}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
          {percentComplete === 100 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-2" />
                All tasks completed!
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <PartyPopper className="w-4 h-4 mr-2" />
                    Complete Onboarding
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Complete Onboarding</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will change the person's status from "onboarding" to "active" and send them a completion email. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCompleteOnboarding}
                      disabled={completingOnboarding}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {completingOnboarding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        "Complete Onboarding"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="w-5 h-5 mr-2" />
            Onboarding Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">
              No onboarding tasks configured. Go to Settings &gt; Onboarding to add tasks.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
                <div key={category}>
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="space-y-2">
                    {categoryTasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-sm border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask.mutate({ personId, taskId: task.id })}
                          disabled={toggleTask.isPending}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            task.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
                          } ${toggleTask.isPending ? "opacity-50" : ""}`}
                        >
                          {task.completed && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={`block text-sm font-medium ${
                              task.completed ? "text-gray-400 line-through" : "text-gray-900"
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="block text-xs text-gray-500 mt-0.5">
                              {task.description}
                            </span>
                          )}
                          {task.completedAt && (
                            <span className="block text-xs text-gray-400 mt-1">
                              Completed {new Date(task.completedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Info Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            {personalInfo && personalInfo.fields.length > 0 && (
              <span className="text-sm text-gray-500">
                {personalInfo.stats.completedFields} of {personalInfo.stats.totalFields} fields completed
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!personalInfo || personalInfo.fields.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">
              No personal info fields configured. Go to Settings &gt; Onboarding to add fields.
            </p>
          ) : (
            <div className="space-y-6">
              {personalInfo.stats.isComplete ? (
                <div className="flex items-center text-green-600 text-sm font-medium pb-2 border-b">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  All required info completed
                </div>
              ) : (
                <div className="flex items-center text-amber-600 text-sm font-medium pb-2 border-b">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {personalInfo.stats.requiredFields - personalInfo.stats.completedRequired} required fields remaining
                </div>
              )}
              {Object.entries(personalInfoByCategory).map(([category, fields]) => (
                <div key={category}>
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div
                        key={field.fieldId}
                        className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-sm text-gray-600">{field.fieldLabel}</span>
                        <span className={`text-sm ${field.value ? "font-medium text-gray-900" : "text-gray-400 italic"}`}>
                          {field.value || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
