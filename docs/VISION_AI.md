# Vision AI & Autonomous UI Analysis Platform

The Vision AI Platform transforms screenshots, widget trees, render trees, layout reports, runtime logs, and visual sessions into structured UI understanding with actionable recommendations. This is the perception layer for future autonomous debugging and UI refinement agents.

## Architecture

```
Planner → Tool Intelligence → Flutter Platform → Runtime Platform → Visual Runtime → Vision AI → Analysis Reports
```

## Modules (17)

| Module | Purpose |
|--------|---------|
| types/ | Core domain types (VisionInput, VisionReport, ScreenUnderstanding, LayoutAnalysis, etc.) |
| analysis/ | Accessibility, Performance, and Responsive analysis |
| screen-understanding/ | Detect screen type, current page, and UI elements |
| layout-analysis/ | Detect overflow, alignment, spacing, safe-area, responsive issues |
| widget-analysis/ | Analyze hierarchy depth, complexity, const usage, duplicates |
| design-analysis/ | Evaluate Material 3, typography, color/spacing/icon consistency |
| comparison/ | Compare two screenshots for layout/widget/theme differences |
| heuristics/ | Rule-based analysis heuristics (overflow, depth, FPS, jank) |
| issues/ | Categorize all findings by severity (critical/high/medium/low/suggestion) |
| recommendations/ | Generate layout/perf/a11y/material/best-practice recommendations |
| confidence/ | Compute confidence score with evidence and reasoning |
| reports/ | Central Vision Engine — produces comprehensive analysis reports |
| sessions/ | Analysis session persistence |
| history/ | Analysis history entries |
| metrics/ | Aggregated metrics (analyses, issues, avg score/confidence) |
| knowledge/ | Material 3 + Flutter best practices + accessibility + responsive rules |
| policies/ | Configurable limits (min confidence, max issues, severity threshold) |

## Vision Engine Pipeline

```
VisionInput (screenshot + widgetTree + renderTree + layoutReport + console + performance)
    ↓
Screen Understanding → detect screen type + elements
    ↓
Layout Analysis → detect overflow, alignment, spacing, safe-area
    ↓
Widget Analysis → detect depth, const usage, heavy trees
    ↓
Design Analysis → evaluate M3, typography, color, spacing
    ↓
Accessibility Analysis → detect touch targets, contrast, semantics
    ↓
Performance Analysis → detect FPS, jank, memory, frame time
    ↓
Responsive Analysis → evaluate phone/tablet/desktop breakpoints
    ↓
Issue Engine → collect + categorize all findings by severity
    ↓
Recommendation Engine → generate actionable recommendations
    ↓
Confidence Engine → compute confidence with evidence
    ↓
Report Engine → produce comprehensive VisionReport
```

## API endpoints (5)

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/v1/vision/analyze | Run full vision analysis |
| POST | /api/v1/vision/compare | Compare two screenshots |
| GET | /api/v1/vision/reports | List analysis reports |
| GET | /api/v1/vision/history | Get analysis history |
| GET | /api/v1/vision/metrics | Get aggregated metrics |

## UI — 10 panels

| Panel | Purpose |
|-------|---------|
| Vision Dashboard | Executive summary, overall score, confidence, score cards |
| Screen Analysis | Screen type, current page, detected elements |
| Layout Analysis | Layout + widget issues with suggestions |
| Design Review | Material 3, typography, color, spacing scores + findings |
| Accessibility | A11y score, WCAG level, touch target/contrast/semantics issues |
| Performance | FPS, jank, memory, frame time + performance findings |
| Recommendations | All recommendations sorted by priority |
| Comparison | Compare two screenshots for visual/layout/widget/theme differences |
| History | Analysis history with scores and issue counts |
| Metrics | Aggregated metrics with common issue categories |

## Report Structure

Every report includes:
- Executive Summary
- Screen Understanding (type, page, elements)
- Layout Analysis (findings, score)
- Widget Analysis (findings, score, const usage)
- Design Analysis (findings, M3/typography/color/spacing scores)
- Accessibility Analysis (findings, score, WCAG level)
- Performance Analysis (findings, FPS, jank, memory, score)
- Responsive Analysis (findings, phone/tablet/desktop scores)
- Issues (all findings categorized by severity)
- Recommendations (actionable, prioritized)
- Confidence (score, evidence, reasoning)
- Overall Score (0-100)
