"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * App-level error boundary. Catches runtime errors in any route segment
 * below the root layout. Shows a user-friendly error page with a retry
 * button instead of a blank screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log to console (in production, send to monitoring service).
    console.error("[FlutterForge AI] Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            An unexpected error occurred. You can try again or return to the
            dashboard.
          </p>
          {error.digest && (
            <p className="mb-4 text-[10px] font-mono text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex items-center justify-center gap-2">
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="outline">
              <a href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
