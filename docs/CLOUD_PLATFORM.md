# Cloud Development Platform

The Cloud Development Platform introduces remote execution. FlutterForge AI can execute builds, tests, analysis, device sessions, and runtime jobs on local machines, remote workers, Docker containers, or cloud runners through a unified execution layer.

## Architecture

```
Planner → Tool Intelligence → Flutter Platform → Runtime Platform → Cloud Runtime Platform → Execution Engine
```

## Runtime Adapters (5)

Every runtime implements the same interface — jobs can execute on any available adapter.

| Adapter | Available | Capabilities |
|---------|-----------|-------------|
| Local Runtime | ✓ | build, run, test, analyze, pub |
| Docker Runtime | ✓ | build, test, analyze, pub |
| Remote Runtime | ✗ | build, run, test, analyze |
| Cloud Runtime | ✗ | build, test |
| CI Runtime | ✗ | build, test, analyze |

## Modules (18)

| Module | Purpose |
|--------|---------|
| types/ | Core domain types (RuntimeAdapter, Worker, CloudJob, FarmDevice, Artifact, DockerImage, etc.) |
| runtime/ | Runtime adapters — interchangeable execution backends |
| workers/ | Worker management — health, capabilities, load, heartbeat |
| scheduler/ | Job scheduler — queue, priority, retries, timeout, dependencies, cancellation |
| queues/ | Queue management — queued + running job views |
| artifacts/ | Artifact management — APK, AAB, ZIP, coverage, logs, reports, screenshots with retention |
| device-farm/ | Device farm — emulators, physical devices, Chrome, desktop with reservation |
| containers/ | Docker — Flutter images, Android SDK images, cached layers |
| builder/ | Build farm — queued/parallel builds for APK/AAB/Web/Desktop |
| jobs/ | High-level job operations (build, run, test, analyze, pub) |
| logs/ | Cloud log collection from all jobs |
| monitoring/ | Worker health, CPU, RAM, queue, failures, success, duration |
| cache/ | Pub cache, Gradle cache, Flutter cache, Docker cache |
| cost/ | Execution cost estimation per runtime type |
| policies/ | Configurable limits (max concurrent, retries, timeout, retention, auto-scale) |
| security/ | Worker auth, artifact signing, encrypted secrets, temporary credentials |
| metrics/ | Aggregated metrics (jobs, builds, success rate, utilization, cost) |
| history/ | Cloud execution history |

## API endpoints (8)

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/v1/cloud/jobs | Submit a job + list queue/completed |
| POST | /api/v1/cloud/build | Queue a build (APK/AAB/Web) |
| POST | /api/v1/cloud/run | Submit a run job |
| POST | /api/v1/cloud/test | Submit a test job |
| GET | /api/v1/cloud/workers | List workers |
| GET | /api/v1/cloud/device-farm | List devices |
| GET | /api/v1/cloud/artifacts | List artifacts |
| GET | /api/v1/cloud/metrics | Get metrics + monitoring snapshot |

## UI — 10 panels

| Panel | Purpose |
|-------|---------|
| Cloud Dashboard | Metrics overview + navigation cards |
| Workers | Worker list with status, CPU, memory, jobs, capabilities |
| Job Queue | Queued + running + completed jobs with status |
| Build Farm | Build target selector, queue build, supported targets |
| Device Farm | Available devices with capabilities and status |
| Artifacts | Build artifacts (APK, AAB, coverage, logs) with size and signing |
| Monitoring | Worker health, CPU, RAM, queue stats, success rate |
| Cloud Logs | Job output logs with runtime type and job type |
| Runtime Adapters | 5 adapters with availability and capabilities |
| Metrics | Aggregated metrics (jobs, builds, success, duration, cost) |

## Safety

- Existing Runtime Platform is preserved — Cloud extends it
- All jobs go through the scheduler with retries, timeout, and dependencies
- Worker authentication, artifact signing, and encrypted secrets
- Cost estimation per runtime type
- Retention policies for artifacts
