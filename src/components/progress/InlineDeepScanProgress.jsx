import React from "react";
import { DeepSearchProgress } from "../../ui/DeepSearchProgress";

/**
 * InlineDeepScanProgress
 * Renders only while a deep scan is running.
 */
export default function InlineDeepScanProgress({ open, progressId }) {
  if (!open) return null; // do not reserve space
  return (
    <div className="w-full max-w-2xl">
      <DeepSearchProgress isProcessing={true} progressId={progressId} />
    </div>
  );
}
