import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DeepSearchProgress({
  progress = 0,
  currentFile = "",
  isProcessing = false,
  onCancel,
}) {
  return (
    <div
      className={cn(
        "w-full max-w-2xl p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all",
        isProcessing ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Deep Search Progress
        </h3>
        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs"
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
        <div
          className="h-3 bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 truncate">
        {currentFile ? (
          <>
            Currently scanning:{" "}
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {currentFile}
            </span>
          </>
        ) : (
          "Preparing files..."
        )}
      </p>
    </div>
  );
}
