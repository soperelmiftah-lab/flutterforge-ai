/**
 * @module lib/auth
 *
 * NextAuth.js configuration with GitHub OAuth + Prisma adapter.
 *
 * - GitHub OAuth for login (no password management)
 * - Prisma adapter stores sessions/accounts in PostgreSQL (Supabase)
 * - JWT strategy for stateless session tokens (works with Vercel edge)
 * - `getCurrentUser()` helper for server components + API routes
 *
 * Required environment variables (set in Vercel → Settings → Environment Variables):
 *   - NEXTAUTH_SECRET       (random 32+ char string)
 *   - GITHUB_CLIENT_ID      (from GitHub OAuth App)
 *   - GITHUB_CLIENT_SECRET  (from GitHub OAuth App)
 *   - DATABASE_URL          (Supabase connection string)
 */

import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { db } from "@/lib/db";

// Read env vars with fallbacks for flexibility.
const GITHUB_ID = process.env.GITHUB_CLIENT_ID || process.env.GITHUB_ID;
const GITHUB_SECRET = process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

// Runtime validation — log clear errors if env vars are missing.
if (process.env.NODE_ENV === "production") {
  if (!NEXTAUTH_SECRET) {
    console.error("[Auth] FATAL: NEXTAUTH_SECRET is not set. Add it in Vercel Environment Variables.");
  }
  if (!GITHUB_ID) {
    console.error("[Auth] FATAL: GITHUB_CLIENT_ID is not set. Add it in Vercel Environment Variables.");
  }
  if (!GITHUB_SECRET) {
    console.error("[Auth] FATAL: GITHUB_CLIENT_SECRET is not set. Add it in Vercel Environment Variables.");
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    // Use JWT so sessions work on Vercel edge + serverless without DB lookup
    strategy: "jwt",
  },
  providers: [
    GitHubProvider({
      clientId: GITHUB_ID!,
      clientSecret: GITHUB_SECRET!,
      // Request additional scopes for repo access (future: push to GitHub)
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    // Inject user id + plan into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as any).plan ?? "free";
      }
      return token;
    },
    // Expose user id + plan to the session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },
  secret: NEXTAUTH_SECRET,
};

/**
 * Get the current authenticated user from a server context.
 * Returns null if not authenticated.
 *
 * Usage in API routes:
 *   import { getCurrentUser } from "@/lib/auth";
 *   import { NextRequest } from "next/server";
 *   export async function GET(req: NextRequest) {
 *     const user = await getCurrentUser(req);
 *     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *     // ...
 *   }
 */
export async function getCurrentUser(req?: Request) {
  try {
    const { getServerSession } = await import("next-auth");
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    return {
      id: (session.user as any).id as string,
      email: session.user.email!,
      name: session.user.name ?? null,
      avatarUrl: session.user.image ?? null,
      plan: ((session.user as any).plan as string) ?? "free",
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication. Throws if not authenticated.
 * Use in API routes that must have a logged-in user.
 */
export async function requireAuth(): Promise<NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
