# Subagent 子代理系统

## 概述

Subagent（子代理）机制通过**上下文隔离**实现"分而治之"的策略，解决了单一 Agent 在处理大型任务时的上下文污染问题。

### 问题：上下文污染

```
单一 Agent 历史记录：
  [探索中...] 读取 file1.ts -> 500 行代码
  [探索中...] 读取 file2.ts -> 300 行代码
  ... 15 个文件 ...
  [开始重构...] "等等，file1 里有什么来着？"
```

当模型的上下文被探索阶段的大量细节填满时，在实际执行任务时注意力会分散，效果下降。

### 解决方案：上下文隔离

```
主 Agent 历史记录：
  [Task: 探索代码库]
    -> 子代理在独立上下文中探索 20 个文件
    -> 仅返回: "认证模块在 src/auth/，数据库在 src/models/"
  [使用干净的上下文开始重构]
```

## Agent 类型

| Agent 类型 | 工具权限                | 用途                 | 系统提示词特点             |
| ---------- | ----------------------- | -------------------- | -------------------------- |
| `explore`  | 只读（bash, read_file） | 代码库探索、文件搜索 | 强调只读、返回简洁摘要     |
| `code`     | 全部工具                | 功能实现、bug 修复   | 强调高效实现               |
| `plan`     | 只读（bash, read_file） | 设计方案、制定计划   | 强调分析和规划、不修改文件 |

## Task 工具

主 Agent 可以使用 `Task` 工具派发子任务：

```typescript
interface TaskInput {
  description: string; // 短描述（3-5 词），用于进度显示
  prompt: string; // 详细指令，传递给子代理
  agent_type: "explore" | "code" | "plan"; // 子代理类型
}
```

### 使用示例

#### 探索代码库

```
Task(explore): "查找所有使用 auth 模块的文件"
```

#### 规划实现策略

```
Task(plan): "设计数据库迁移策略"
```

#### 实现功能

```
Task(code): "实现用户注册表单"
```

## 进度显示

子代理执行时会显示实时进度，完成后显示总结：

```
> Task: 探索代码库
  [explore] 探索代码库 ... 5 tools, 3.2s
  [explore] 探索代码库 - done (8 tools, 5.1s)
```

## 典型使用场景

### 场景一：大型代码库探索

```
用户：帮我理解这个项目的架构

主 Agent：
  > Task(explore): 分析项目架构
    [explore] 分析项目架构 - done (12 tools, 18.3s)

  根据探索结果，这个项目是一个...
```

### 场景二：规划后执行

```
用户：重构用户认证模块

主 Agent：
  1. 先派 plan 代理分析现有代码
     > Task(plan): 分析认证模块

  2. 根据计划，派 code 代理逐步实现
     > Task(code): 重构 auth.ts
     > Task(code): 更新测试用例
```

## 核心机制

### 上下文隔离

```typescript
// 主 Agent 消息历史
const mainMessages: Message[] = [...];

// 子代理消息历史（完全隔离）
const subMessages: Message[] = [
  { role: 'user', content: taskPrompt }
];
```

子代理：

1. 拥有独立的消息历史数组
2. 看不到主 Agent 的任何对话内容
3. 执行完毕后，只有最终文本摘要返回给主 Agent
4. 主 Agent 的上下文保持干净

### 工具过滤

```typescript
function getToolsForAgent(agentType: string): Tool[] {
  const config = AGENT_TYPES[agentType];
  if (config.tools === "*") {
    return BASE_TOOLS; // 不包含 Task 工具
  }
  return BASE_TOOLS.filter((t) => config.tools.includes(t.name));
}
```

- 子代理不能获得 `Task` 工具（防止无限递归）
- `explore` 和 `plan` 只能访问只读工具
- `code` 可以访问所有基础工具

## 文件结构

```
src/
├── core/
│   ├── agent-types.ts    # Agent 类型注册表
│   └── subagent.ts       # Subagent 执行器
└── tools/
    └── task.ts           # Task 工具定义
```

## 自定义 Agent

### 使用 /agents 命令

你可以通过 `/agents` 命令创建自定义 Agent：

```bash
# 列出所有自定义 Agent
/agents

# 查看帮助
/agents help

# 交互式创建 Agent
/agents create

# 通过描述直接创建
/agents create 一个专门做代码审查的agent，只读权限，关注代码质量

# 删除 Agent
/agents delete reviewer
```

### Agent 配置文件

自定义 Agent 保存在 `.mini-cc/agents/` 目录下，格式为 JSON：

```json
{
  "name": "reviewer",
  "description": "代码审查专家，专注于发现代码问题和改进建议",
  "tools": ["bash", "read_file"],
  "prompt": "You are a code review expert. Analyze code for bugs, security issues, and improvements. Never modify files, only report findings."
}
```

### 使用自定义 Agent

创建后，可以像内置 Agent 一样使用：

```
Task(reviewer): "审查 src/core 目录下的代码"
```

## 扩展（开发者）

Agent 类型配置在 `src/core/agent-types.ts` 中定义，可以轻松添加新的内置类型：

```typescript
export const AGENT_TYPES: Record<string, AgentTypeConfig> = {
  // 添加新类型
  review: {
    description: "Code review agent for analyzing code quality",
    tools: ["bash", "read_file"],
    prompt: "You are a code review agent. Analyze code and report issues.",
  },
};
```
