# /init 命令使用指南

## 功能概述

`/init` 命令是 mini-claude-code 的核心功能之一，它会让 AI 分析您的代码库并自动生成一个 `AGENTS.md` 文件，该文件包含：

- 构建、测试、运行命令
- 代码风格指南
- 项目架构信息
- 开发流程说明

一旦创建，`AGENTS.md` 的内容会自动注入到每次 AI 对话的上下文中，让 AI 更好地理解您的项目规范。

## 使用方法

### 1. 首次使用

在项目根目录启动 mini-claude-code：

```bash
cd your-project
mini-claude-code
```

如果项目中还没有 `AGENTS.md` 文件，启动时会看到提示：

```
💡 Getting started:
   Run /init to create an AGENTS.md file with codebase documentation
   This helps the AI understand your project better
```

### 2. 执行 /init 命令

在提示符后输入：

```
❯ /init
```

AI 会自动：
1. 扫描项目文件（package.json, README.md, tsconfig.json 等）
2. 分析代码结构和风格
3. 检查现有的 Cursor 规则或 Copilot 指令
4. 生成 `AGENTS.md` 文件

### 3. 查看生成的文件

命令执行完成后，项目根目录会出现 `AGENTS.md` 文件，内容示例：

```markdown
# AGENTS.md

## Essential Commands
- Install: npm install
- Dev: npm run dev
- Build: npm run build
- Test: npm test
- Test single: npm test -- path/to/test.ts

## Code Style
- **Imports**: Use absolute imports with @ alias
- **Formatting**: Prettier with 2-space indent
- **Types**: TypeScript strict mode enabled
- **Naming**: camelCase for variables, PascalCase for components
- **Errors**: Use custom error classes

## Architecture
- Entry: src/index.ts
- Core: src/core/
- Tools: src/tools/
- Utils: src/utils/
```

## 核心特性

### 自动分析

AI 会检查以下文件来了解您的项目：

- `package.json` / `pyproject.toml` / `Cargo.toml` - 依赖和脚本
- `README.md` - 项目概述
- `.eslintrc` / `.prettierrc` / `tsconfig.json` - 代码风格配置
- `.cursorrules` / `.cursor/rules/` - Cursor 规则
- `.github/copilot-instructions.md` - Copilot 指令

### 智能改进

如果 `AGENTS.md` 已存在，`/init` 命令会改进现有内容，而不是完全替换。

### 兼容性

同时支持 `AGENTS.md` 和 `CLAUDE.md` 文件：
- 两个文件都会被加载
- 如果只有 `CLAUDE.md`，也会正常工作
- 推荐使用 `AGENTS.md` 作为主文件

## 工作原理

### 1. 上下文注入

每次 AI 对话时，系统会：
1. 读取 `AGENTS.md` 和 `CLAUDE.md`（如果存在）
2. 将内容注入到 AI 的系统提示词中
3. AI 根据这些信息指导工作

### 2. 缓存机制

- 文件内容在会话期间缓存
- 避免重复读取文件
- 重启程序后会重新加载

### 3. Onboarding 状态

- 执行 `/init` 后，onboarding 提示不再显示
- 状态保存在 `.mini-cc/project-config.json`

## 高级用法

### 手动编辑 AGENTS.md

您可以直接编辑 `AGENTS.md` 文件来：
- 添加特定的开发规范
- 补充项目特殊要求
- 更新命令或流程

修改后重启 mini-claude-code 即可生效。

### 项目模板

为常见项目类型准备模板：

**Node.js/TypeScript 项目示例：**
```markdown
## Commands
- Install: npm install
- Dev: npm run dev
- Build: npm run build
- Test: npm test -- <file>
- Lint: npm run lint
- Format: npm run format

## Code Style
- TypeScript strict mode
- ESLint + Prettier
- Absolute imports with @ alias
- camelCase variables, PascalCase classes
```

**Python 项目示例：**
```markdown
## Commands
- Install: pip install -r requirements.txt
- Run: python main.py
- Test: pytest tests/
- Test single: pytest tests/test_file.py::test_function
- Lint: ruff check .
- Format: black .

## Code Style
- PEP 8 compliance
- Type hints for all functions
- Black for formatting
- snake_case naming
```

## 最佳实践

### 1. 保持简洁

- 20-50 行是理想长度
- 只包含 AI 真正需要的信息
- 使用列表和标题组织内容

### 2. 重点突出

关键信息：
- ✅ 测试单个文件的方法（高频需求）
- ✅ 导入路径规范（绝对 vs 相对）
- ✅ 错误处理模式
- ❌ 过于详细的技术栈说明
- ❌ 冗长的历史背景

### 3. 及时更新

项目变化时更新 `AGENTS.md`：
- 添加新的构建命令
- 更新代码规范
- 调整目录结构说明

### 4. 版本控制

将 `AGENTS.md` 纳入 Git：
```bash
git add AGENTS.md
git commit -m "Add project documentation for AI agents"
```

团队成员共享同一份文档，确保 AI 行为一致。

## 故障排除

### AGENTS.md 未生成

可能原因：
- AI 响应被中断
- 文件写入权限问题

解决方法：
- 重新执行 `/init`
- 检查目录权限
- 手动创建 `AGENTS.md` 文件

### AI 未遵循规范

可能原因：
- `AGENTS.md` 内容不够明确
- 规范与 AI 的系统提示冲突

解决方法：
- 使用更明确的语言描述规范
- 添加具体示例
- 重启 mini-claude-code 确保加载最新内容

### 文件过大

如果 `AGENTS.md` 超过 1MB：
- 系统会自动截断
- 建议精简内容，删除冗余信息

## 相关命令

- `/help` - 查看所有可用命令
- `/clear` - 清屏
- `/reset` - 清空对话上下文（不影响 AGENTS.md）

## 配置文件位置

- 项目文档：`./AGENTS.md`, `./CLAUDE.md`
- 项目配置：`./.mini-cc/project-config.json`
- Onboarding 状态存储在项目配置中

## 示例工作流

1. **新项目初始化**
   ```bash
   cd new-project
   mini-claude-code
   # 看到 onboarding 提示
   ❯ /init
   # AI 生成 AGENTS.md
   ```

2. **后续对话**
   ```bash
   ❯ Add error handling to all API calls
   # AI 会遵循 AGENTS.md 中定义的错误处理规范
   ```

3. **更新规范**
   ```bash
   # 编辑 AGENTS.md
   vim AGENTS.md
   # 重启 mini-claude-code
   mini-claude-code
   ```

## 总结

`/init` 命令和 `AGENTS.md` 功能让 AI 能够：
- 🎯 了解项目特定的构建和测试命令
- 📐 遵循项目的代码风格规范
- 🏗️ 理解项目的架构和组织方式
- ⚡ 更高效地完成开发任务

通过一次简单的 `/init` 命令，让 AI 成为真正了解您项目的开发伙伴！

