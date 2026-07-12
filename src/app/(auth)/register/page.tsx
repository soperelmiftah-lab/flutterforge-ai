"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowRight, Github, Chrome, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";

const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your name"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    agree: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  });

type RegisterValues = z.infer<typeof registerSchema>;

const perks = [
  "3 active projects on the free plan",
  "Monaco-grade Flutter editor",
  "First access to the AI coding agent",
  "Local-first — your code stays yours",
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", agree: true as unknown },
  });

  const onSubmit = async (_values: RegisterValues) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Account created. Welcome to FlutterForge AI!");
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
      {/* Marketing column */}
      <div className="hidden lg:block">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Start forging Flutter apps with AI
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Join the foundation release. Your workspace is ready — AI, preview, and
          build engines arrive in the next phases.
        </p>
        <ul className="mt-6 space-y-3">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-foreground/80">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="h-3 w-3" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Form column */}
      <div className="rounded-2xl border border-border/70 bg-card/70 p-8 shadow-xl backdrop-blur-xl">
        <div className="mb-6 text-center lg:text-left">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Free forever — no credit card required
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
          <span className="text-xs text-muted-foreground">or sign up with email</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Ada Lovelace"
                className="pl-9"
                autoComplete="name"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

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
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                className="pl-9"
                autoComplete="new-password"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="agree" {...register("agree")} defaultChecked />
            <Label htmlFor="agree" className="text-xs leading-relaxed text-muted-foreground">
              I agree to the Terms of Service and Privacy Policy
            </Label>
          </div>
          {errors.agree && (
            <p className="text-xs text-destructive">{errors.agree.message}</p>
          )}

          <Button type="submit" className="h-10 w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
            {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground lg:hidden">
        © {new Date().getFullYear()} {siteConfig.name} · v{siteConfig.version}
      </p>
    </div>
  );
}
