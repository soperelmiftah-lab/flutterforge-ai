import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 text-center">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-72 w-[640px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="ff-grid-bg absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      </div>

      <Link href="/" className="mb-8" aria-label="Home">
        <Logo size={40} />
      </Link>

      <p className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-7xl font-semibold tracking-tight text-transparent sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 text-xl font-semibold text-foreground sm:text-2xl">
        This page drifted off the widget tree
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The route you&apos;re looking for doesn&apos;t exist — or hasn&apos;t been
        built yet. It might be arriving in a future phase.
      </p>

      <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/">
            <Home className="mr-1.5 h-4 w-4" /> Back to home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <Search className="mr-1.5 h-4 w-4" /> Open workspace
          </Link>
        </Button>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> FlutterForge AI
      </Link>
    </div>
  );
}
