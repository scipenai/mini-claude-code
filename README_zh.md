# Mini Claude Code Agent

[English](README.md) | [中文](README_zh.md)

Claude Code CLI 编程助手的最小实现版本。

## 概述

Mini Claude Code Agent 是 Claude Code 的简化版本，它允许 AI 模型通过一组强大的工具直接与您的代码库进行交互。它提供了一个命令行界面，使 Claude 能够：

- 读取和写入文件
- 执行 shell 命令
- 编辑文件中的文本
- 导航项目结构

此工具旨在与 LLM 模型一起使用，以提供交互式编码体验，LLM 可以直接对您的代码库进行更改。

## 功能特性

- **编程助手**：使用大型语言模型作为核心 AI 引擎
- **文件操作**：支持读取、写入和编辑文件
- **Shell 执行**：可以在项目工作区中执行 shell 命令
- **MCP 集成**：支持 Model Context Protocol，可连接多种 MCP 服务器扩展功能
- **上下文压缩**：智能的自动和手动上下文压缩，处理长对话的 token 限制
- **实时状态栏**：显示 MCP 连接状态和上下文使用率，一目了然
- **安全限制**：防止路径遍历和危险命令执行
- **实时反馈**：在执行过程中提供视觉反馈
- **模块化架构**：组织良好的代码库，便于维护和扩展

## 技术栈

- TypeScript
- Node.js
- Anthropic AI SDK
- MCP (Model Context Protocol) SDK

## 前提条件

- Node.js >= 16.0.0
- Anthropic 兼容的 API 密钥
- 代理 LLM 模型

## 快速启动

最快的启动方式：

1. 设置环境变量：

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
export ANTHROPIC_BASE_URL="your-anthropic-compatible-api-base-url"
export ANTHROPIC_MODEL="model-name"
```

2. 使用 npx 直接运行（无需安装）：

```bash
npx -y @scipen/mini-claude-code
```

就是这么简单！助手会启动，你可以开始与它交互。

## 安装

```bash
npm install -g @scipen/mini-claude-code
```

或者从源码克隆并构建：

```bash
git clone https://github.com/scipenai/mini-claude-code.git
cd mini-claude-code
npm install
```

## 配置

将您的 Anthropic API 密钥设置为环境变量：

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
export ANTHROPIC_BASE_URL="your-anthropic-compatable-api-base-url"
export ANTHROPIC_MODEL="model-name"
```

## 安装依赖

```bash
npm install
```

## 构建项目

```bash
npm run build
```

## 运行项目

### 开发模式运行

```bash
npm run dev
```

### 生产模式运行

```bash
npm run build
npm start
```

## 使用方法

启动程序后，您可以在终端中与代码助手进行交互：

1. 输入您的需求或问题
2. 助手将自动分析并执行相应的操作（如文件修改、命令执行等）
3. 查看执行结果和输出

输入 `exit` 或 `quit` 退出程序。

### 可用命令

- `/help` - 显示帮助信息
- `/clear` - 清屏
- `/history` - 显示对话历史
- `/reset` - 重置对话历史
- `/compact` - 手动压缩对话历史为摘要
- `/stats` - 显示上下文使用统计
- `/save` - 保存当前对话到文件
- `/load` - 从文件加载对话历史
- `/todo` - 显示待办事项状态
- `exit/quit` - 退出程序

### 上下文压缩

Mini Claude Code 支持智能的上下文压缩功能，可以处理长对话的 token 限制问题：

- **自动压缩**：当 token 使用率达到 92% 时自动触发，透明地压缩对话历史为摘要
- **手动压缩**：使用 `/compact` 命令手动压缩对话历史
- **统计查看**：使用 `/stats` 命令查看当前的 token 使用情况

详细说明请参阅 [上下文压缩文档](docs/CONTEXT_COMPRESSION_zh.md) ([English](docs/CONTEXT_COMPRESSION.md))。

### 实时状态栏

在每次命令后显示实时状态信息：

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔌 MCP: 2 │ 🟢 Context: 45% │ 💬 Messages: 67                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **MCP 状态**：显示已连接的 MCP 服务器数量
- **上下文使用率**：用颜色编码显示上下文使用百分比
  - 🟢 绿色 (0-74%): 正常
  - 🟡 黄色 (75-91%): 警告
  - 🔴 红色 (92-100%): 临界（即将自动压缩）
- **消息数量**：当前对话的消息总数

详细说明请参阅 [状态栏文档](docs/STATUS_BAR_zh.md) ([English](docs/STATUS_BAR.md))。

## MCP 集成

Mini Claude Code 支持 Model Context Protocol (MCP)，可以连接各种 MCP 服务器来扩展功能。

### 配置 MCP 服务器

1. 在项目根目录创建 `.mcp.json` 文件：

```bash
cp .mcp.example.json .mcp.json
```

2. 编辑配置文件添加你需要的 MCP 服务器。

支持三种传输方式：
- **stdio**: 本地进程通信（默认）
- **streamable_http**: HTTP 远程服务器（推荐）
- **sse**: 旧版 HTTP/SSE（已弃用）

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
    },
    {
      "name": "remote-service",
      "transport": "streamable_http",
      "url": "https://your-mcp-server.example.com/mcp"
    }
  ]
}
```

详细的 MCP 配置和使用说明，请参阅：
- [MCP 集成指南](docs/MCP_GUIDE_zh.md)
- [MCP 传输方式详解](docs/MCP_TRANSPORT_zh.md)

### 交互示例

```
User: 创建一个名为 hello.js 的新文件，打印 "Hello, World!"
Assistant: 我将创建一个名为 hello.js 的新文件，打印 "Hello, World!"。

Tool: write_file
{
  "path": "hello.js",
  "content": "console.log('Hello, World!');\n"
}

Result: wrote 26 bytes to hello.js

我已经创建了 hello.js 文件，其中包含一个简单的程序，在控制台打印 "Hello, World!"。您可以使用 `node hello.js` 运行它。
```

## 安全性

该助手包含几项安全措施：

- 阻止危险命令如 `rm -rf /`、`shutdown`、`reboot` 和 `sudo`
- 限制文件访问到当前工作目录
- 为命令执行实现超时机制

## 项目结构

```
src/
├── config/                    # 配置和环境变量
│   ├── environment.ts          # 环境配置
│   └── mcp-config.ts           # MCP 服务器配置
├── core/                      # 核心助手逻辑
│   ├── agent.ts                # 主要助手逻辑（含自动压缩）
│   ├── mcp-client.ts           # MCP 客户端管理器
│   ├── todo-manager.ts         # Todo 任务管理
│   └── todo-reminder.ts        # Todo 提醒功能
├── tools/                     # 工具实现
│   ├── bash.ts                 # Shell 命令执行
│   ├── dispatcher.ts           # 工具分发器
│   ├── editText.ts             # 文本编辑操作
│   ├── readFile.ts             # 文件读取操作
│   ├── todoWrite.ts            # Todo 列表管理工具
│   ├── tools.ts                # 工具定义
│   └── writeFile.ts            # 文件写入操作
├── types/                     # TypeScript 类型定义
│   ├── index.ts                # 共享 TypeScript 接口
│   └── storage.ts              # 存储相关类型定义
├── utils/                     # 实用函数
│   ├── context-compression.ts  # 上下文压缩核心逻辑
│   ├── file-helpers.ts         # 文件实用函数
│   ├── logger.ts               # 日志工具
│   ├── storage/                # 存储管理
│   │   ├── history.ts          # 对话历史存储
│   │   ├── index.ts            # 存储管理入口
│   │   └── log.ts              # 日志存储
│   ├── text-helpers.ts         # 文本处理实用函数
│   ├── tokens.ts               # Token 计数工具
│   └── ui.ts                   # UI 工具（含状态栏）
└── index.ts                   # 主程序入口
```

## 开发

### 版本管理

本项目使用自动化脚本进行版本管理。

快速参考：

```bash
# 仅更新版本号
npm run version:patch  # 0.5.0 -> 0.5.1
npm run version:minor  # 0.5.1 -> 0.6.0
npm run version:major  # 0.5.1 -> 1.0.0
```

所有版本号会自动从 `package.json` 同步。

### 添加新工具

要向助手添加新工具：

1. 在 `src/tools/` 目录中创建新文件
2. 实现工具功能
3. 将工具定义添加到 `src/tools/tools.ts`
4. 更新 `src/tools/dispatcher.ts` 中的分发器以处理新工具

### 代码组织

代码库遵循模块化架构：

- **config**：配置和环境变量
- **core**：核心助手逻辑和主执行循环
- **tools**：单个工具实现和工具管理
- **types**：TypeScript 类型定义
- **utils**：常见操作的实用函数
- **scripts**：构建和发布自动化脚本

## 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

该项目基于 MIT 许可证 - 详情请见 [LICENSE](LICENSE) 文件。

## 致谢

- 该项目受到 [shareAI-lab/mini_claude_code](https://github.com/shareAI-lab/mini_claude_code) 和 [shareAI-lab/Kode](https://github.com/shareAI-lab/Kode) 的启发