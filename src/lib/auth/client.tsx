"use client";

import * as React from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

/**
 * Auth Provider — wraps the app with NextAuth SessionProvider.
 * Add this to the root layout.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

/**
 * useAuth — client-side hook for auth state.
 *
 * Returns:
 *   - user: the current user (null if not logged in)
 *   - loading: true while session is being fetched
 *   - signIn: () => redirect to GitHub OAuth
 *   - signOut: () => log out
 */
export function useAuth() {
  const { data: session, status } = useSession();
  return {
    user: session?.user
      ? {
          id: (session.user as any).id as string,
          email: session.user.email!,
          name: session.user.name ?? null,
          avatarUrl: session.user.image ?? null,
          plan: ((session.user as any).plan as string) ?? "free",
        }
      : null,
    loading: status === "loading",
    signIn: () => signIn("github", { callbackUrl: "/" }),
    signOut: () => signOut({ callbackUrl: "/" }),
  };
}
