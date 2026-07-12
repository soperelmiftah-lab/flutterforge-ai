# Agent Registry

17 placeholder agents are registered in the Agent Operating System. Each agent declares its capabilities, allowed tools, and allowed models. Future phases implement the actual agent logic.

## Registered agents

| ID | Name | Category | Icon |
|----|------|----------|------|
| `agent.planner` | Planner Agent | planning | 🧠 |
| `agent.flutter` | Flutter Agent | flutter | 🐦 |
| `agent.ui` | UI Agent | ui | 🎨 |
| `agent.riverpod` | Riverpod Agent | state | ⚡ |
| `agent.supabase` | Supabase Agent | backend | 🔥 |
| `agent.backend` | Backend Agent | backend | 🛠️ |
| `agent.api` | API Agent | api | 🔌 |
| `agent.testing` | Testing Agent | testing | 🧪 |
| `agent.debug` | Debug Agent | debug | 🐛 |
| `agent.review` | Review Agent | review | 👁️ |
| `agent.security` | Security Agent | security | 🔒 |
| `agent.performance` | Performance Agent | performance | 🚀 |
| `agent.database` | Database Agent | database | 🗄️ |
| `agent.docs` | Documentation Agent | docs | 📚 |
| `agent.i18n` | Localization Agent | i18n | 🌍 |
| `agent.git` | Git Agent | git | 🌿 |
| `agent.deployment` | Deployment Agent | deployment | 📦 |

## Agent descriptor

```typescript
interface AgentDescriptor {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  icon: string;
  capabilities: string[];      // what this agent can do
  allowedTools: string[];      // tool ids from the Execution Engine
  allowedModels: string[];     // preferred AI models
  priority: TaskPriority;
  status: "idle" | "busy" | "error" | "offline";
  version: string;
  health: "healthy" | "degraded" | "down";
  implemented: boolean;        // false = placeholder
}
```

## Agent Router

The Router automatically assigns tasks to agents:

1. **Intent-preferred**: Check the intent→agent mapping first
2. **Capability match**: Find agents with all required tools
3. **Priority**: Prefer high-priority agents
4. **Fallback**: Default to the Planner Agent

```typescript
const routing = routeTasks(tasks, intentType);
// { "task_1": "agent.ui", "task_2": "agent.flutter", ... }
```

### Intent → Agent mapping

| Intent | Preferred agents |
|--------|-----------------|
| `bug-fix` | Debug, Planner |
| `feature-request` | Flutter, Riverpod, UI |
| `generate-ui` | UI, Flutter |
| `generate-api` | API, Backend |
| `generate-database` | Database, Supabase |
| `testing` | Testing |
| `deployment` | Deployment |
| `code-review` | Review, Security |

## Registering a new agent

Add to `src/features/planner/registry/index.ts`:

```typescript
{
  id: "agent.myagent",
  name: "My Agent",
  description: "What it does",
  category: "backend",
  icon: "🔧",
  capabilities: ["capability-1", "capability-2"],
  allowedTools: ["fs.create_file", "fs.write_file"],
  allowedModels: [],
  priority: "normal",
  status: "idle",
  version: "0.1.0",
  health: "healthy",
  implemented: false,
}
```

The agent automatically appears in the Agent Registry UI and is available to the Router.

## API

```bash
GET /api/v1/planner/agents
# Returns all 17 agents + health stats
```
