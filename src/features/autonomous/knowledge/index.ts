/**
 * @module features/autonomous/knowledge
 *
 * Knowledge Base — common Flutter issue patterns and their known solutions.
 */

export interface IssuePattern {
  id: string;
  category: string;
  pattern: string;
  solution: string;
  confidence: number;
  preventionTip: string;
}

export const knowledgeBase: IssuePattern[] = [
  { id: "kb.overflow", category: "layout-issue", pattern: "Bottom overflowed by N pixels", solution: "Wrap content in SingleChildScrollView or use Expanded", confidence: 0.9, preventionTip: "Always test on different screen sizes" },
  { id: "kb.setstate-build", category: "runtime-exception", pattern: "setState() called during build()", solution: "Move state update to event handler or addPostFrameCallback", confidence: 0.95, preventionTip: "Never call setState in build()" },
  { id: "kb.disposed-controller", category: "runtime-exception", pattern: "A TextEditingController was used after being disposed", solution: "Add mounted check after async gap or remove dispose call", confidence: 0.85, preventionTip: "Always check mounted after await" },
  { id: "kb.null-safety", category: "dart-error", pattern: "Null check operator used on a null value", solution: "Add null check or use null-aware operators", confidence: 0.8, preventionTip: "Use sound null safety" },
  { id: "kb.missing-const", category: "analysis-error", pattern: "Prefer const constructors", solution: "Add const keyword to widget constructors", confidence: 0.95, preventionTip: "Enable prefer_const_constructors lint rule" },
  { id: "kb.gradle-fail", category: "build-failure", pattern: "Gradle build failed", solution: "Check Gradle version, SDK compatibility, and cache", confidence: 0.7, preventionTip: "Pin Gradle and SDK versions" },
  { id: "kb.deprecated-widget", category: "flutter-error", pattern: "Widget is deprecated", solution: "Migrate to the replacement widget", confidence: 0.9, preventionTip: "Stay updated with Flutter releases" },
  { id: "kb.missing-key", category: "state-issue", pattern: "Widget state lost after reorder", solution: "Add Key to widget constructor", confidence: 0.85, preventionTip: "Use keys for stateful widgets in lists" },
];

export function findPattern(message: string): IssuePattern | undefined {
  const lower = message.toLowerCase();
  return knowledgeBase.find((p) => lower.includes(p.pattern.toLowerCase()));
}
