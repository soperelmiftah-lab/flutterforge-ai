"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowRight, Github, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (_values: LoginValues) => {
    setLoading(true);
    // Mock JWT flow — real auth wired in a future phase.
    await new Promise((r) => setTimeout(r, 700));
    toast.success("Welcome back to FlutterForge AI");
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border/70 bg-card/70 p-8 shadow-xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue to your workspace
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-10" type="button">
            <Github className="mr-2 h-4 w-4" /> GitHub
          </Button>
          <Button variant="outline" className="h-10" type="button">
            <Chrome className="mr-2 h-4 w-4" /> Google
          </Button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or continue with email</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-9"
                autoComplete="email"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="text-xs text-primary hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-9"
                autoComplete="current-password"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" {...register("remember")} defaultChecked />
            <Label htmlFor="remember" className="text-sm text-muted-foreground">
              Keep me signed in
            </Label>
          </div>

          <Button type="submit" className="h-10 w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up free
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By signing in you agree to {siteConfig.name}&apos;s Terms & Privacy Policy.
      </p>
    </div>
  );
}

export { User };
