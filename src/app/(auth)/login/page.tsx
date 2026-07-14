"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth/client";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const error = params.get("error");
  const { signIn } = useAuth();
  const [githubLoading, setGithubLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  React.useEffect(() => {
    if (error) {
      toast.error("Authentication failed. Please try again.");
    }
  }, [error]);

  const handleGitHubLogin = async () => {
    setGithubLoading(true);
    // signIn from useAuth redirects to GitHub OAuth
    signIn();
  };

  const onSubmit = async (_values: LoginValues) => {
    toast.info("Email/password login is not available yet. Please use GitHub OAuth.");
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border/70 bg-card/70 p-8 shadow-xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Welcome to {siteConfig.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue to your workspace
          </p>
        </div>

        {/* GitHub OAuth — primary login method */}
        <Button
          className="h-11 w-full"
          size="lg"
          onClick={handleGitHubLogin}
          disabled={githubLoading}
        >
          {githubLoading ? (
            <span className="animate-pulse">Redirecting to GitHub…</span>
          ) : (
            <>
              <Github className="mr-2 h-5 w-5" />
              Continue with GitHub
            </>
          )}
        </Button>

        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or email (coming soon)</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 opacity-50 pointer-events-none">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-9"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-9"
                {...register("password")}
              />
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled>
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button onClick={handleGitHubLogin} className="font-medium text-primary hover:underline">
          Sign up with GitHub
        </button>
      </p>
    </div>
  );
}
