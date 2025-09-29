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
- **安全限制**：防止路径遍历和危险命令执行
- **实时反馈**：在执行过程中提供视觉反馈
- **模块化架构**：组织良好的代码库，便于维护和扩展

## 技术栈

- TypeScript
- Node.js
- Anthropic AI SDK

## 前提条件

- Node.js >= 16.0.0
- Anthropic 兼容的 API 密钥
- 代理 LLM 模型

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
├── config/              # 配置和环境变量
│   └── environment.ts    # 环境配置
├── core/                # 核心助手逻辑
│   ├── agent.ts          # 主要助手逻辑
│   ├── spinner.ts        # CLI 旋转器用于视觉反馈
├── tools/               # 工具实现
│   ├── bash.ts           # Shell 命令执行
│   ├── dispatcher.ts     # 工具分发器
│   ├── editText.ts       # 文本编辑操作
│   ├── readFile.ts       # 文件读取操作
│   ├── tools.ts          # 工具定义
│   └── writeFile.ts      # 文件写入操作
├── types/               # TypeScript 类型定义
│   └── index.ts          # 共享 TypeScript 接口
├── utils/               # 实用函数
│   ├── file-helpers.ts   # 文件实用函数
│   ├── logger.ts         # 日志工具
│   └── text-helpers.ts   # 文本处理实用函数
└── index.ts             # 主程序入口

dist/                     # 编译后的 JavaScript 文件
package.json              # 项目配置和依赖
package-lock.json         # 依赖锁定文件
tsconfig.json             # TypeScript 配置
```

## 开发

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