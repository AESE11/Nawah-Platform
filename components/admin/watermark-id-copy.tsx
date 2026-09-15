"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type WatermarkIdCopyProps = {
  watermarkId: string;
  copyLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
};

export function WatermarkIdCopy({ watermarkId, copyLabel, copiedLabel, copyFailedLabel }: WatermarkIdCopyProps) {
  const [feedback, setFeedback] = useState<string>("");

  async function copyWatermarkId() {
    try {
      await navigator.clipboard.writeText(watermarkId);
      setFeedback(copiedLabel);
    } catch {
      setFeedback(copyFailedLabel);
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <code className="min-w-0 break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm font-semibold text-slate-800">
        {watermarkId}
      </code>
      <Button type="button" size="sm" variant="outline" onClick={copyWatermarkId}>
        {copyLabel}
      </Button>
      {feedback ? <p role="status" className="text-xs text-slate-600">{feedback}</p> : null}
    </div>
  );
}
