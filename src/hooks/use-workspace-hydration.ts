"use client";

import * as React from "react";
import { useWorkspaceIndexStore } from "@/stores/workspace-index-store";
import { useDependencyStore } from "@/stores/dependency-store";

/**
 * useWorkspaceHydration — ensures the workspace index + dependency graph are
 * loaded before an inspector page renders. Call once at the top of any page
 * that consumes workspace intelligence data.
 */
export function useWorkspaceHydration() {
  const buildIndex = useWorkspaceIndexStore((s) => s.buildIndex);
  const buildGraph = useDependencyStore((s) => s.buildGraph);
  const indexedAt = useWorkspaceIndexStore((s) => s.lastIndexedAt);
  const hasFiles = useWorkspaceIndexStore((s) => s.files.length > 0);

  React.useEffect(() => {
    if (!hasFiles) buildIndex();
    if (!indexedAt) buildGraph();
  }, [hasFiles, indexedAt, buildIndex, buildGraph]);
}
