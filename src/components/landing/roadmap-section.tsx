import { roadmap } from "@/config/roadmap";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export function LandingRoadmap() {
  return (
    <section
      id="roadmap"
      className="scroll-mt-20 border-t border-border/60 bg-muted/20 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            The path ahead
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A phased roadmap, built to scale
          </h2>
          <p className="mt-4 text-muted-foreground">
            Each phase delivers a coherent slice. The architecture is designed
            so features compose — never bolted on.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {roadmap.map((phase) => {
            const StatusIcon =
              phase.status === "done"
                ? CheckCircle2
                : phase.status === "active"
                  ? Loader2
                  : Circle;
            return (
              <div
                key={phase.phase}
                className={`relative flex flex-col rounded-xl border bg-card p-5 ${
                  phase.status === "active"
                    ? "border-primary/50 shadow-lg shadow-primary/5"
                    : "border-border/70"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {phase.phase}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      phase.status === "active"
                        ? "bg-primary/15 text-primary"
                        : phase.status === "done"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <StatusIcon
                      className={`h-3 w-3 ${phase.status === "active" ? "animate-spin" : ""}`}
                    />
                    {phase.eta}
                  </span>
                </div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {phase.title}
                </h3>
                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
