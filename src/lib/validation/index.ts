/**
 * @module lib/validation
 *
 * Zod schemas for API request validation. Use `validateRequest()` in API
 * routes to safely parse + validate the request body with proper error
 * responses.
 *
 * Usage:
 *   import { validateRequest, plannerPlanSchema } from "@/lib/validation";
 *   const { data, error } = await validateRequest(req, plannerPlanSchema);
 *   if (error) return error; // 400 response
 *   // data is now typed + validated
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ─── Common schemas ──────────────────────────────────────────────────────

export const stringSchema = z.string().min(1);
export const optionalString = z.string().optional();
export const idSchema = z.string().min(1).max(100);

// ─── Planner ─────────────────────────────────────────────────────────────

export const plannerPlanSchema = z.object({
  input: z.string().min(1).max(10000),
});

// ─── Tool Intelligence ───────────────────────────────────────────────────

export const toolAnalyzeSchema = z.object({
  objective: z.string().min(1).max(5000),
  intentType: z.string().optional(),
  requiredFiles: z.array(z.string()).optional(),
});

export const toolExecuteSchema = z.object({
  chainId: z.string().min(1),
  skipApproval: z.boolean().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
});

// ─── Flutter Platform ────────────────────────────────────────────────────

export const flutterGenerateSchema = z.object({
  description: z.string().min(1).max(2000),
  mode: z.enum(["screen", "widget", "model", "service"]).optional(),
  className: z.string().max(100).optional(),
});

export const flutterReviewSchema = z.object({
  code: z.string().min(1).max(50000),
});

export const flutterScaffoldSchema = z.object({
  templateId: z.string().min(1),
});

export const flutterSaveSchema = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(100000),
});

// ─── Runtime ─────────────────────────────────────────────────────────────

export const runtimeRunSchema = z.object({
  deviceId: z.string().min(1),
  target: z.string().optional(),
  flavor: z.string().optional(),
  args: z.array(z.string()).optional(),
  environment: z.record(z.string()).optional(),
});

export const runtimeBuildSchema = z.object({
  target: z.enum(["apk", "aab", "web", "ios", "macos", "windows", "linux"]).optional(),
  mode: z.enum(["debug", "profile", "release"]).optional(),
  flavor: z.string().optional(),
  args: z.array(z.string()).optional(),
});

// ─── Cloud ───────────────────────────────────────────────────────────────

export const cloudJobSchema = z.object({
  type: z.enum(["build", "run", "test", "analyze", "pub", "custom"]),
  command: z.string().min(1).max(200),
  args: z.array(z.string()).max(50).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  runtimeType: z.enum(["local", "docker", "remote", "cloud", "ci"]).optional(),
  projectId: z.string().max(100).optional(),
});

export const cloudBuildSchema = z.object({
  target: z.enum(["apk", "aab", "web", "windows", "linux", "macos"]).optional(),
  mode: z.enum(["debug", "profile", "release"]).optional(),
  flavor: z.string().optional(),
  parallel: z.boolean().optional(),
});

// ─── Autonomous ──────────────────────────────────────────────────────────

export const autonomousAnalyzeSchema = z.object({
  category: z.string().max(50).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  source: z.string().max(50).optional(),
  file: z.string().max(500).optional(),
  line: z.number().int().min(1).optional(),
  evidence: z.array(z.string()).optional(),
  useAI: z.boolean().optional(),
});

// ─── Helper: validate request body ───────────────────────────────────────

export type ValidationResult<T> =
  | { data: T; error: null }
  | { data: null; error: NextResponse };

/**
 * Validate a request body against a Zod schema.
 * Returns `{ data, error: null }` on success, or `{ data: null, error }`
 * on failure (where `error` is a ready-to-return 400 NextResponse).
 */
export async function validateRequest<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: { code: "INVALID_JSON", message: "Request body is not valid JSON" } },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      data: null,
      error: NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: firstError?.message ?? "Validation failed",
            path: firstError?.path,
          },
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}
