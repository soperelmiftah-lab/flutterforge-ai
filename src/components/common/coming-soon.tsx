import * as React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComingSoonProps {
  title: string;
  description?: string;
  className?: string;
  icon?: React.ElementType;
  badge?: string;
  children?: React.ReactNode;
}

/**
 * Placeholder panel used for reserved regions (preview, bottom panel, AI chat,
 * future modules). Communicates "intentionally reserved" rather than "broken".
 */
export function ComingSoon({
  title,
  description,
  className,
  icon: Icon = Sparkles,
  badge = "Coming soon",
  children,
}: ComingSoonProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center",
        className
      )}
    >
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary ff-pulse" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {badge}
          </Badge>
        </div>
        {description && (
          <p className="mx-auto max-w-xs text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
