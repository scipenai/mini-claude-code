# 上下文压缩功能

[English](CONTEXT_COMPRESSION.md) | [中文](CONTEXT_COMPRESSION_zh.md)

## 概述

Mini Claude Code 现在支持智能的上下文压缩系统，用于处理 AI 模型的 token 限制问题。当对话历史过长时，系统会自动或手动将对话压缩为摘要，同时保留关键信息，确保开发工作的连续性。

## 功能特性

### 1. 自动压缩（Auto-Compact）

- **触发条件**：当 token 使用率达到模型上下文限制的 92% 时自动触发
- **触发时机**：每次用户查询前自动检查
- **执行过程**：
  1. 检测到 token 使用率超过 92%
  2. 自动调用 AI 生成对话摘要
  3. 清理历史消息，保留摘要
  4. 透明地继续对话

### 2. 手动压缩（Manual Compact）

- **触发方式**：用户执行 `/compact` 命令
- **使用场景**：
  - 用户主动清理对话历史
  - 在开始新任务前整理上下文
  - 减少不必要的 token 消耗

### 3. 上下文统计（Context Stats）

- **触发方式**：用户执行 `/stats` 命令
- **显示信息**：
  - 当前消息数量
  - 估算的 token 使用量
  - 使用百分比
  - 距离自动压缩还剩余多少 token
  - 当前状态（正常 / 接近限制）

## 使用方法

### 查看上下文统计

```
❯ /stats
```

输出示例：
```
ℹ️  📊 Context Statistics:
   Messages: 25
   Tokens: ~45000 / 200000
   Usage: 23%
   Remaining: ~139000 tokens until auto-compact
   Status: ✅ OK
```

### 手动压缩对话

```
❯ /compact
```

系统将：
1. 显示当前对话统计
2. 调用 AI 生成结构化摘要
3. 替换历史记录为压缩后的摘要
4. 显示压缩结果（消息数量、token 节省等）

输出示例：
```
ℹ️  📊 Current conversation: 25 messages, ~45000 tokens
ℹ️  🔄 Compressing conversation history...
✅ Context compressed successfully!
   Messages: 25 → 2
   Tokens: ~45000 → ~3500 (saved ~41500 tokens)
```

### 自动压缩

自动压缩完全透明，无需用户干预。当检测到 token 使用率达到 92% 时，系统会：

```
ℹ️  🔄 Context limit approaching, initiating automatic compression...
✅ Context compressed: 50 messages → 2 messages
   Token usage: 184000 → 4200 (saved 179800 tokens)
```

## 压缩原理

### Token 计数

系统使用启发式算法估算 token 数量：
- 英文文本：约 0.25 token/字符
- 包含工具使用、工具结果等所有消息类型
- 提供保守的估算，确保在限制内

### 摘要生成

压缩时，AI 会生成包含以下 8 个部分的结构化摘要：

1. **技术上下文（Technical Context）**
   - 开发环境、工具、框架、配置

2. **项目概览（Project Overview）**
   - 项目目标、功能、范围

3. **代码变更（Code Changes）**
   - 创建/修改/分析的文件

4. **调试与问题（Debugging & Issues）**
   - 遇到的问题及解决方案

5. **当前状态（Current Status）**
   - 刚完成的工作、当前状态

6. **待办任务（Pending Tasks）**
   - 待办事项、优先级

7. **用户偏好（User Preferences）**
   - 编码风格、沟通方式

8. **关键决策（Key Decisions）**
   - 重要技术决策及理由

这种结构化的摘要确保了所有关键信息都被保留，AI 可以无缝地继续工作。

## 配置

### 上下文限制

默认上下文限制为 200,000 tokens。如果你的模型有不同的限制，可以在 `src/utils/context-compression.ts` 中修改：

```typescript
const DEFAULT_CONTEXT_LIMIT = 200_000;  // 修改为你的模型限制
```

### 自动压缩阈值

默认在使用率达到 92% 时触发自动压缩。如需调整：

```typescript
const AUTO_COMPACT_THRESHOLD_RATIO = 0.92;  // 修改为 0.85 则在 85% 时触发
```

## 最佳实践

1. **定期查看统计**：使用 `/stats` 命令了解当前的 token 使用情况

2. **任务切换前手动压缩**：在开始新的大型任务前，使用 `/compact` 清理历史

3. **信任自动压缩**：自动压缩会保留所有关键信息，不用担心丢失重要上下文

4. **长对话分段**：对于特别长的开发会话，可以考虑分段进行，在每个阶段结束时手动压缩

## 技术实现

### 文件结构

- `src/utils/tokens.ts` - Token 计数工具
- `src/utils/context-compression.ts` - 压缩核心逻辑
- `src/core/agent.ts` - 集成自动压缩检查
- `src/index.ts` - 手动压缩命令

### 核心函数

- `countTotalTokens(messages)` - 计算总 token 数
- `shouldAutoCompact(messages)` - 判断是否需要自动压缩
- `executeAutoCompact(messages)` - 执行自动压缩
- `executeManualCompact(messages)` - 执行手动压缩
- `getContextStats(messages)` - 获取统计信息

## 故障排除

### 压缩失败

如果压缩失败，系统会：
- 显示错误信息
- 保留原始消息列表
- 继续正常工作

### Token 估算不准确

Token 估算使用启发式算法，可能与实际值有偏差。这是正常的，系统设计上偏向保守估算以确保安全。

### 压缩后丢失上下文

如果发现压缩后 AI 失去了某些重要上下文，可以：
- 在下次查询中重新提供相关信息
- 考虑使用 `/reset` 完全重置对话
- 调整自动压缩阈值，让压缩触发得更晚

## 参考资料

- [README_zh.md](../README_zh.md) - 项目总体说明
- [context_compression.txt](../context_compression.txt) - 参考实现文档

