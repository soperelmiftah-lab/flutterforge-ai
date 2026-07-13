/**
 * @module features/visual-runtime/annotations
 *
 * Annotations — highlight widgets, overflow, spacing, and warnings on
 * the screenshot preview.
 */

import type { Annotation, AnnotationType } from "../types";
import { uid } from "@/lib/utils";

const annotationColors: Record<AnnotationType, string> = {
  "highlight-widget": "#34d399",
  "highlight-overflow": "#f43f5e",
  "highlight-spacing": "#f59e0b",
  "highlight-warning": "#fbbf24",
};

/** Create an annotation. */
export function createAnnotation(type: AnnotationType, rect: { x: number; y: number; width: number; height: number }, label: string): Annotation {
  return {
    id: uid("annot"),
    type,
    rect,
    label,
    color: annotationColors[type],
  };
}

/** Get annotation color. */
export function getAnnotationColor(type: AnnotationType): string {
  return annotationColors[type];
}

/** Get all annotation types (for UI). */
export function getAnnotationTypes(): Array<{ type: AnnotationType; label: string; color: string }> {
  return [
    { type: "highlight-widget", label: "Widget", color: annotationColors["highlight-widget"] },
    { type: "highlight-overflow", label: "Overflow", color: annotationColors["highlight-overflow"] },
    { type: "highlight-spacing", label: "Spacing", color: annotationColors["highlight-spacing"] },
    { type: "highlight-warning", label: "Warning", color: annotationColors["highlight-warning"] },
  ];
}
