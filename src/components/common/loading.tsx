import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  label?: string;
  className?: string;
}

/** Inline loading spinner with optional label. */
export function Loading({ label, className }: LoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-sm text-muted-foreground",
        className
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      {label && <span>{label}</span>}
    </div>
  );
}

/** Full-page loading skeleton for route-level suspense fallbacks. */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Loading label={label} />
    </div>
  );
}
