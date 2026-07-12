import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * FlutterForge logo — a forged "F" mark built from layered chevrons suggesting
 * motion/craft, paired with the wordmark. Pure SVG so it scales crisply and
 * inherits currentColor for theming.
 */
export function Logo({ className, size = 32, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id="ff-grad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="42" height="42" rx="12" fill="url(#ff-grad)" />
        <rect x="3" y="3" width="42" height="42" rx="12" fill="black" fillOpacity="0.08" />
        {/* Forged F mark */}
        <path
          d="M16 14h17M16 14v20M16 24h12"
          stroke="white"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* spark */}
        <circle cx="35.5" cy="13.5" r="2.4" fill="white" />
      </svg>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-semibold tracking-tight text-[15px] text-foreground">
            FlutterForge
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            AI Studio
          </span>
        </div>
      )}
    </div>
  );
}

export { siteConfig };
