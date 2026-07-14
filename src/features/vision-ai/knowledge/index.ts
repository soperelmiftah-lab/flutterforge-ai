/**
 * @module features/vision-ai/knowledge
 *
 * Knowledge Base — Material 3 guidelines, Flutter best practices,
 * accessibility rules, responsive rules, and widget best practices.
 */

export interface KnowledgeRule {
  id: string;
  category: "material-3" | "flutter-best-practice" | "accessibility" | "responsive" | "widget";
  rule: string;
  description: string;
  severity: "info" | "warning" | "error";
}

export const knowledgeBase: KnowledgeRule[] = [
  { id: "kb.m3.color-scheme", category: "material-3", rule: "Use ColorScheme.fromSeed()", description: "Generate consistent color palettes from a seed color", severity: "info" },
  { id: "kb.m3.elevation", category: "material-3", rule: "M3 elevation ≤ 3 for cards", description: "M3 uses tonal elevation, not shadows", severity: "warning" },
  { id: "kb.m3.navbar", category: "material-3", rule: "Use NavigationBar (not BottomNavigationBar)", description: "M3 replaces M2 components", severity: "info" },
  { id: "kb.flutter.const", category: "flutter-best-practice", rule: "Use const constructors", description: "Const widgets skip rebuilds", severity: "warning" },
  { id: "kb.flutter.dispose", category: "flutter-best-practice", rule: "Dispose controllers", description: "TextEditingController, AnimationController must be disposed", severity: "error" },
  { id: "kb.flutter.keys", category: "flutter-best-practice", rule: "Use keys in stateful widgets", description: "Keys preserve state across reorders", severity: "info" },
  { id: "kb.a11y.touch-target", category: "accessibility", rule: "Min 48×48 dp touch targets", description: "WCAG 2.5.5 Target Size", severity: "warning" },
  { id: "kb.a11y.contrast", category: "accessibility", rule: "4.5:1 contrast ratio", description: "WCAG AA text contrast", severity: "error" },
  { id: "kb.a11y.semantics", category: "accessibility", rule: "Label interactive elements", description: "Screen readers need labels", severity: "warning" },
  { id: "kb.resp.breakpoints", category: "responsive", rule: "Use LayoutBuilder for breakpoints", description: "compact <600, medium 600-840, expanded >840", severity: "info" },
  { id: "kb.resp.navrail", category: "responsive", rule: "NavigationRail on tablet/desktop", description: "Bottom nav doesn't scale to wide screens", severity: "warning" },
  { id: "kb.widget.depth", category: "widget", rule: "Keep widget depth < 10", description: "Deep trees are hard to maintain and slower to rebuild", severity: "warning" },
  { id: "kb.widget.extract", category: "widget", rule: "Extract reusable widgets", description: "Keep build methods small", severity: "info" },
];

export function getRulesByCategory(category: KnowledgeRule["category"]): KnowledgeRule[] {
  return knowledgeBase.filter((r) => r.category === category);
}
