import { AppShell } from "@/components/layout/app-shell";

/**
 * Protected application route group. Every page under (app)/ renders inside
 * the AppShell (sidebar + topbar + status bar). Auth guarding is wired here
 * in future phases; for now it's open so the foundation is explorable.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
