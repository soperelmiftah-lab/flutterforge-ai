/** Layout Engine */
export interface LayoutWidgetInfo { name: string; axis: string; description: string; when: string; alternatives: string[]; commonIssues: string[]; }
export const layoutWidgets: LayoutWidgetInfo[] = [
  { name: "Column", axis: "vertical", description: "Vertical layout", when: "Stacking widgets vertically", alternatives: ["ListView"], commonIssues: ["Overflow", "Not using mainAxisSize.min"] },
  { name: "Row", axis: "horizontal", description: "Horizontal layout", when: "Side by side", alternatives: ["Wrap"], commonIssues: ["Overflow without Expanded"] },
  { name: "Stack", axis: "stack", description: "Overlay widgets", when: "Layering", alternatives: ["Positioned"], commonIssues: ["Non-bounded children"] },
  { name: "Expanded", axis: "both", description: "Fill available space", when: "Preventing overflow", alternatives: ["Flexible"], commonIssues: ["Using outside Flex"] },
  { name: "Container", axis: "both", description: "Multi-purpose wrapper", when: "Padding/decoration/sizing", alternatives: ["Padding", "SizedBox"], commonIssues: ["Both color and decoration"] },
  { name: "CustomScrollView", axis: "scroll", description: "Compose slivers", when: "Complex scrollable", alternatives: ["ListView"], commonIssues: ["Non-sliver children"] },
];
export function getLayoutWidget(name: string): LayoutWidgetInfo | undefined { return layoutWidgets.find(w => w.name === name); }
