import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Use full height (no scroll, no padding) — for IDE-like pages e.g. workspace. */
  fill?: boolean;
}

/**
 * PageContainer — standard page chrome. Provides vertical scrolling, max-width
 * gutters and consistent padding for normal pages. Pass `fill` to opt into a
 * full-bleed, non-scrolling surface (used by the workspace).
 */
export function PageContainer({ children, className, fill }: PageContainerProps) {
  if (fill) {
    return <div className={cn("h-full w-full", className)}>{children}</div>;
  }
  return (
    <div className="ff-scroll h-full overflow-y-auto">
      <div className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8", className)}>
        {children}
      </div>
    </div>
  );
}
