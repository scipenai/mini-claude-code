# MCP (Model Context Protocol) 集成指南

## 概述

Mini Claude Code 现在支持 MCP (Model Context Protocol)，允许你通过 MCP 服务器扩展 AI 助手的能力。

## 什么是 MCP？

MCP (Model Context Protocol) 是一个开放协议，允许 AI 应用程序与外部工具和数据源安全地交互。通过 MCP，你可以：

- 连接到各种数据源（文件系统、数据库、API 等）
- 使用第三方工具和服务
- 扩展 AI 助手的能力，而无需修改核心代码

## 快速开始

### 1. 安装依赖

确保已安装项目依赖：

```bash
npm install
```

### 2. 创建 MCP 配置文件

在项目根目录创建 `.mcp.json` 文件：

```bash
cp .mcp.example.json .mcp.json
```

### 3. 配置 MCP 服务器

编辑 `.mcp.json` 文件，配置你想要使用的 MCP 服务器：

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
    }
  ]
}
```

### 4. 运行应用

```bash
npm run dev
```

应用启动时会自动连接到配置的 MCP 服务器。

## 配置说明

### 传输方式

Mini Claude Code 支持三种 MCP 传输方式：

#### 1. stdio 传输（本地进程）

通过标准输入输出与本地 MCP 服务器进程通信，适用于：
- 本地安装的 MCP 服务器
- Node.js、Python 等本地进程
- 需要访问本地资源的服务器

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  ]
}
```

#### 2. Streamable HTTP 传输（推荐用于远程服务器）

**协议版本：2025-03-26（新标准）**

通过 Streamable HTTP 与远程 MCP 服务器通信，这是最新的 HTTP 传输标准，适用于：
- 部署在云端的 MCP 服务
- 远程 HTTP API 服务
- 需要跨网络访问的服务器
- 支持会话管理和通知

```json
{
  "mcpServers": [
    {
      "name": "remote-service",
      "transport": "streamable_http",
      "url": "https://your-mcp-server.example.com/mcp"
    }
  ]
}
```

#### 3. SSE 传输（已弃用，仅用于向后兼容）

**协议版本：2024-11-05（旧标准）**

⚠️ **注意**：此传输方式已被弃用，建议使用 `streamable_http` 代替。

```json
{
  "mcpServers": [
    {
      "name": "legacy-service",
      "transport": "sse",
      "url": "https://legacy-server.example.com/sse"
    }
  ]
}
```

### 配置字段说明

#### 通用字段
- `name`: 服务器的唯一标识符（必填）
- `transport`: 传输方式（可选，默认为 `"stdio"`）
  - `"stdio"`: 本地进程通信
  - `"streamable_http"`: Streamable HTTP 传输（推荐用于远程服务）
  - `"sse"`: SSE 传输（已弃用）

#### stdio 传输字段
- `command`: 启动服务器的命令，如 `npx`, `node`, `python` 等（stdio 必填）
- `args`: 命令参数数组（可选）
- `env`: 环境变量对象（可选）

#### HTTP 传输字段（streamable_http 和 sse）
- `url`: MCP 服务器的 HTTP/HTTPS URL（必填）

> 💡 **提示**：关于传输方式的详细说明、使用场景和最佳实践，请参阅 [MCP 传输方式详解](MCP_TRANSPORT_zh.md)

## 可用的 MCP 服务器

### 官方 MCP 服务器

1. **文件系统服务器** (`@modelcontextprotocol/server-filesystem`)
   - 提供文件和目录操作
   - 需要指定允许访问的目录路径

2. **GitHub 服务器** (`@modelcontextprotocol/server-github`)
   - 提供 GitHub API 访问
   - 需要 GitHub Personal Access Token

3. **PostgreSQL 服务器** (`@modelcontextprotocol/server-postgres`)
   - 提供数据库查询功能
   - 需要数据库连接字符串

4. **Brave 搜索服务器** (`@modelcontextprotocol/server-brave-search`)
   - 提供网络搜索功能
   - 需要 Brave Search API Key

5. **Slack 服务器** (`@modelcontextprotocol/server-slack`)
   - 提供 Slack 消息发送和接收
   - 需要 Slack Bot Token

### 社区 MCP 服务器

查看 [MCP Servers Repository](https://github.com/modelcontextprotocol/servers) 获取更多社区开发的服务器。

## 示例配置

### 示例 1: 文件系统访问

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    }
  ]
}
```

### 示例 2: GitHub 集成

```json
{
  "mcpServers": [
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxx"
      }
    }
  ]
}
```

### 示例 3: 多个服务器

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    },
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxx"
      }
    },
    {
      "name": "brave-search",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "BSA_xxxxxxxxxxxxxxxxxxxx"
      }
    }
  ]
}
```

## 使用 MCP 工具

连接到 MCP 服务器后，AI 助手可以自动使用这些服务器提供的工具。

### 查看可用工具

启动应用时，会显示连接的服务器数量和可用工具数量：

```
🔌 正在连接 2 个 MCP 服务器...

  → 正在连接: filesystem...
    ✓ filesystem: 5 个工具可用
  → 正在连接: github...
    ✓ github: 8 个工具可用

✅ 成功连接 2 个 MCP 服务器
```

### 工具命名规则

MCP 工具名称格式为：`服务器名称__工具名称`

例如：
- `filesystem__read_file`
- `github__create_issue`
- `brave-search__web_search`

### 使用示例

启动应用后，你可以直接向 AI 助手提出需求：

```
User: 在 GitHub 上搜索关于 TypeScript 的最新 issues
Assistant: 我将使用 GitHub MCP 工具来搜索相关的 issues...
[调用 github__search_issues 工具]
```

AI 助手会自动选择合适的 MCP 工具来完成任务。

## 故障排除

### MCP 服务器连接失败

1. **检查命令是否正确**
   - 确保 `command` 和 `args` 配置正确
   - 对于 npm 包，使用 `npx -y` 来自动安装

2. **检查环境变量**
   - 确保所需的 API keys 和 tokens 已正确设置
   - 环境变量应在 `env` 字段中配置

3. **检查网络连接**
   - 某些 MCP 服务器需要网络访问
   - 确保防火墙不阻止连接

4. **查看日志**
   - 启动时会显示连接状态和错误信息
   - 检查控制台输出以了解问题详情

### 工具调用失败

1. **检查权限**
   - 确保 API tokens 有足够的权限
   - 对于文件系统服务器，确保路径可访问

2. **检查参数**
   - 确保传递给工具的参数格式正确
   - 查看 MCP 服务器文档了解参数要求

## 开发自定义 MCP 服务器

你可以开发自己的 MCP 服务器来提供自定义功能。

### 基本步骤

1. 使用 MCP SDK 创建服务器
2. 定义工具和资源
3. 实现工具处理逻辑
4. 在 `.mcp.json` 中配置你的服务器

### 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 服务器示例](https://github.com/modelcontextprotocol/servers)

## 最佳实践

1. **安全性**
   - 不要在配置文件中直接存储敏感信息
   - 使用环境变量管理 API keys
   - 限制文件系统服务器的访问范围

2. **性能**
   - 只连接需要的 MCP 服务器
   - 对于频繁使用的工具，考虑缓存结果

3. **可维护性**
   - 使用描述性的服务器名称
   - 在配置文件中添加注释说明
   - 定期更新 MCP 服务器到最新版本

## 常见用例

### 1. 项目文档管理

使用文件系统服务器读取和更新项目文档：

```json
{
  "mcpServers": [
    {
      "name": "docs",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./docs"]
    }
  ]
}
```

### 2. GitHub 工作流

使用 GitHub 服务器管理 issues、PRs 和仓库：

```json
{
  "mcpServers": [
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  ]
}
```

### 3. 数据分析

使用数据库服务器进行数据查询和分析：

```json
{
  "mcpServers": [
    {
      "name": "database",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  ]
}
```

### 4. 网络研究

使用搜索服务器进行网络信息检索：

```json
{
  "mcpServers": [
    {
      "name": "search",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  ]
}
```

## 总结

通过 MCP 集成，Mini Claude Code 可以连接到各种外部工具和服务，大大扩展了 AI 助手的能力。你可以根据项目需求灵活配置 MCP 服务器，创建强大的开发工作流。

如有问题或建议，请访问项目 GitHub 仓库提交 issue。