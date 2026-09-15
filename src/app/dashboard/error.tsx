"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Safety net for the dashboard segment. Individual panels already degrade on
 * their own; this catches anything that escapes them.
 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] unhandled error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-sm flex-col items-center rounded-2xl border border-slate-200/80 bg-white px-8 py-10 text-center shadow-[0_1px_2px_0_rgb(16_24_40/0.04)]">
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="text-[16px] font-semibold text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          This page could not be loaded. Your data is unaffected.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-5 inline-flex h-9 cursor-pointer items-center rounded-lg bg-[#1a9d5e] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#15824e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
