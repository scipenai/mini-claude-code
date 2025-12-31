# Subagent System

## Overview

The Subagent mechanism implements a "divide and conquer" strategy through **context isolation**, solving the context pollution problem that occurs when a single agent handles large tasks.

### Problem: Context Pollution

```
Single Agent History:
  [exploring...] read file1.ts -> 500 lines
  [exploring...] read file2.ts -> 300 lines
  ... 15 more files ...
  [now refactoring...] "Wait, what did file1 contain?"
```

When the model's context fills with exploration details, it leaves little room for the actual task, causing attention to scatter and effectiveness to decrease.

### Solution: Context Isolation

```
Main Agent History:
  [Task: explore codebase]
    -> Subagent explores 20 files (in its own context)
    -> Returns ONLY: "Auth in src/auth/, DB in src/models/"
  [now refactoring with clean context]
```

## Agent Types

| Agent Type | Tool Access | Purpose | System Prompt Focus |
|-----------|-------------|---------|---------------------|
| `explore` | Read-only (bash, read_file) | Code exploration, file search | Emphasizes read-only, concise summaries |
| `code` | All tools | Feature implementation, bug fixes | Emphasizes efficient implementation |
| `plan` | Read-only (bash, read_file) | Design, planning | Emphasizes analysis and planning, no modifications |

## Task Tool

The main agent can use the `Task` tool to dispatch subtasks:

```typescript
interface TaskInput {
  description: string;   // Short description (3-5 words) for progress display
  prompt: string;        // Detailed instructions for the subagent
  agent_type: "explore" | "code" | "plan";  // Subagent type
}
```

### Usage Examples

#### Explore Codebase
```
Task(explore): "Find all files using the auth module"
```

#### Plan Implementation Strategy
```
Task(plan): "Design a migration strategy for the database"
```

#### Implement Feature
```
Task(code): "Implement the user registration form"
```

## Progress Display

Subagents show real-time progress during execution:

```
> Task: explore codebase
  [explore] explore codebase ... 5 tools, 3.2s
  [explore] explore codebase - done (8 tools, 5.1s)
```

## Typical Use Cases

### Case 1: Large Codebase Exploration

```
User: Help me understand this project's architecture

Main Agent:
  > Task(explore): analyze project architecture
    [explore] analyze project architecture - done (12 tools, 18.3s)

  Based on the exploration, this project is a...
```

### Case 2: Plan Then Execute

```
User: Refactor the user authentication module

Main Agent:
  1. First dispatch plan agent to analyze existing code
     > Task(plan): analyze auth module

  2. Based on the plan, dispatch code agent to implement
     > Task(code): refactor auth.ts
     > Task(code): update test cases
```

## Core Mechanisms

### Context Isolation

```typescript
// Main agent message history
const mainMessages: Message[] = [...];

// Subagent message history (completely isolated)
const subMessages: Message[] = [
  { role: 'user', content: taskPrompt }
];
```

Subagent:
1. Has its own independent message history array
2. Cannot see any of the main agent's conversation
3. Only the final text summary returns to the main agent
4. Main agent's context stays clean

### Tool Filtering

```typescript
function getToolsForAgent(agentType: string): Tool[] {
  const config = AGENT_TYPES[agentType];
  if (config.tools === "*") {
    return BASE_TOOLS; // Does NOT include Task tool
  }
  return BASE_TOOLS.filter((t) => config.tools.includes(t.name));
}
```

- Subagents cannot access the `Task` tool (prevents infinite recursion)
- `explore` and `plan` can only access read-only tools
- `code` can access all base tools

## File Structure

```
src/
├── core/
│   ├── agent-types.ts    # Agent type registry
│   └── subagent.ts       # Subagent executor
└── tools/
    └── task.ts           # Task tool definition
```

## Custom Agents

### Using the /agents Command

You can create custom agents using the `/agents` command:

```bash
# List all custom agents
/agents

# Show help
/agents help

# Interactive agent creation
/agents create

# Create directly with description
/agents create a code review agent with read-only access, focusing on code quality

# Delete an agent
/agents delete reviewer
```

### Agent Configuration File

Custom agents are saved in `.mini-cc/agents/` directory as JSON:

```json
{
  "name": "reviewer",
  "description": "Code review expert focusing on code quality and improvements",
  "tools": ["bash", "read_file"],
  "prompt": "You are a code review expert. Analyze code for bugs, security issues, and improvements. Never modify files, only report findings."
}
```

### Using Custom Agents

Once created, use them like built-in agents:

```
Task(reviewer): "Review code in the src/core directory"
```

## Extension (Developers)

Agent type configurations are defined in `src/core/agent-types.ts` and can easily be extended with new built-in types:

```typescript
export const AGENT_TYPES: Record<string, AgentTypeConfig> = {
  // Add new type
  review: {
    description: 'Code review agent for analyzing code quality',
    tools: ['bash', 'read_file'],
    prompt: 'You are a code review agent. Analyze code and report issues.',
  },
};
```

