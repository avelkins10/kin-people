"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsAddButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function SettingsAddButton({
  onClick,
  label,
  disabled,
  className,
}: SettingsAddButtonProps) {
  if (label) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "gap-2 text-gray-600 border-gray-200 bg-white",
          "hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50",
          "transition-all duration-200 font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
          "active:scale-[0.97]",
          className
        )}
      >
        <Plus className="w-4 h-4" />
        {label}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        "active:scale-[0.95]",
        className
      )}
      aria-label="Add"
    >
      <Plus className="w-4 h-4" />
    </Button>
  );
}
