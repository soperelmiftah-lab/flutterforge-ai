# Supabase Setup Guide — FlutterForge AI v1.1.0

This guide walks you through setting up Supabase for FlutterForge AI.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name**: `flutterforge-ai` (or any name)
   - **Database Password**: Generate a strong password and **save it** (you'll need it)
   - **Region**: Choose the closest to your users
   - **Plan**: Free tier is sufficient for v1.0
4. Click **Create new project** and wait ~2 minutes for provisioning

## Step 2: Get Your Database Connection String

1. Go to **Project Settings** → **Database**
2. Scroll to **Connection string**
3. Copy the **URI** format:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. Replace `[password]` with your database password
5. Set this as your `DATABASE_URL` in `.env`

## Step 3: Configure GitHub OAuth

### Create GitHub OAuth App (already done)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: FlutterForge AI
   - **Homepage URL**: `http://localhost:3000` (dev) or your Vercel URL (prod)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. **Register application**
5. Copy **Client ID** and generate **Client Secret**
6. Set in `.env`:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

### For Production (Vercel)

Update the GitHub OAuth App:
- **Homepage URL**: `https://flutterforge-ai.vercel.app`
- **Authorization callback URL**: `https://flutterforge-ai.vercel.app/api/auth/callback/github`

## Step 4: Push Database Schema

```bash
# Install dependencies (if not done)
bun install

# Push the Prisma schema to Supabase
bun run db:push

# This creates all 30+ tables in your Supabase PostgreSQL database
```

## Step 5: Set Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `AI_ENCRYPTION_KEY` | Random 32+ char string |
| `NEXTAUTH_SECRET` | Random 32+ char string |
| `NEXTAUTH_URL` | `https://flutterforge-ai.vercel.app` |
| `GITHUB_CLIENT_ID` | Your GitHub OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | Your GitHub OAuth Client Secret |
| `ALLOWED_ORIGINS` | `https://flutterforge-ai.vercel.app` |

## Step 6: Deploy & Test

1. Push to GitHub → Vercel auto-deploys
2. Visit `https://flutterforge-ai.vercel.app`
3. Click **Sign in** → redirected to GitHub
4. Authorize the app → redirected back, now logged in
5. All data now persists in Supabase PostgreSQL

## Verify Supabase Tables

Go to Supabase Dashboard → **Table Editor** — you should see:
- `users`, `accounts`, `sessions` (auth)
- `projects`, `project_files`, `workspaces`, `settings`
- `planner_sessions`, `tool_chains`, `generated_code`
- `run_sessions`, `build_jobs`, `runtime_logs`, `runtime_history`
- `visual_sessions`, `screenshots`, `visual_events`, `visual_console`, `frame_stats`
- `vision_reports`, `vision_history`
- `autonomous_pipelines`, `autonomous_history`, `autonomous_learning`
- `cloud_workers`, `cloud_jobs`, `artifacts`, `cloud_logs`, `cloud_history`

## Troubleshooting

### "Can't reach database server"
- Check your `DATABASE_URL` format
- Ensure the password is correct (URL-encode special characters)
- Try port `5432` (direct) instead of `6543` (pooler)

### "Authentication failed"
- Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
- Check the callback URL in GitHub OAuth App matches your domain
- Check `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your deployment URL

### "Rate limited"
- Default is 100 requests/minute/IP
- Increase via `RATE_LIMIT_MAX_REQUESTS` env var
