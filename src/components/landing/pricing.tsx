import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "For exploring FlutterForge and personal projects.",
    features: [
      "3 active projects",
      "Monaco editor workspace",
      "Community templates",
      "Local-first storage",
    ],
    cta: "Start free",
    href: "/auth/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "—",
    cadence: "soon",
    description: "For builders shipping Flutter apps regularly.",
    features: [
      "Unlimited projects",
      "AI coding agent (Phase 2)",
      "Live & device preview (Phase 3)",
      "APK builder pipeline (Phase 3)",
      "Cloud sync & history",
    ],
    cta: "Join the waitlist",
    href: "/auth/register",
    highlighted: true,
  },
  {
    name: "Team",
    price: "—",
    cadence: "soon",
    description: "For teams collaborating on Flutter at scale.",
    features: [
      "Everything in Pro",
      "Shared workspaces",
      "Multi-agent orchestration",
      "GitHub & Supabase integrations",
      "Priority support",
    ],
    cta: "Contact us",
    href: "/auth/register",
    highlighted: false,
  },
];

export function LandingPricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-t border-border/60 bg-muted/20 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 gap-1.5 rounded-full px-3 py-1">
            <Sparkles className="h-3 w-3" /> Pricing placeholder
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simple, builder-friendly pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Free to start. Paid tiers activate as AI, preview, and build
            features ship in later phases.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border bg-card p-6 ${
                tier.highlighted
                  ? "border-primary/50 shadow-lg shadow-primary/10"
                  : "border-border/70"
              }`}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[10px] uppercase tracking-wide">
                  Recommended
                </Badge>
              )}
              <h3 className="text-sm font-semibold text-foreground">{tier.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {tier.price}
                </span>
                <span className="text-xs text-muted-foreground">/{tier.cadence}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="mt-6"
                variant={tier.highlighted ? "default" : "outline"}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
