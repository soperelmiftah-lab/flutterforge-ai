/**
 * @module features/cloud/jobs
 *
 * Jobs — high-level job operations for build, run, test, analyze, pub.
 */

import type { JobType, RuntimeType } from "../types";
import { enqueueJob } from "../scheduler";

export function submitBuild(target: string, mode: string, runtimeType: RuntimeType = "local") {
  return enqueueJob({ type: "build", command: "flutter", args: ["build", target, `--${mode}`], runtimeType });
}

export function submitRun(deviceId: string, runtimeType: RuntimeType = "local") {
  return enqueueJob({ type: "run", command: "flutter", args: ["run", "-d", deviceId], runtimeType });
}

export function submitTest(runtimeType: RuntimeType = "local") {
  return enqueueJob({ type: "test", command: "flutter", args: ["test"], runtimeType });
}

export function submitAnalyze(runtimeType: RuntimeType = "local") {
  return enqueueJob({ type: "analyze", command: "flutter", args: ["analyze"], runtimeType });
}

export function submitPub(command: string, runtimeType: RuntimeType = "local") {
  return enqueueJob({ type: "pub", command: "flutter", args: ["pub", command], runtimeType });
}
