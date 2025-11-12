# Skills 系统

Mini Claude Code 支持 Anthropic Skills 规范，允许你安装和使用技能来扩展 AI 的能力。

## 什么是 Skills？

Skills 是包含专业指令和资源的文档，帮助 AI 更好地完成特定任务。每个技能包含：
- 详细的任务指导
- 最佳实践建议
- 辅助脚本和模板
- 参考文档

## 快速开始

### 安装技能

技能需要手动放置在以下目录中：

**项目级技能**（优先级高）：
```bash
.mini-cc/skills/
```

**全局技能**：
```bash
~/.mini-cc/skills/
```

### 技能目录结构

每个技能必须是一个包含 `SKILL.md` 文件的目录：

```
my-skill/
├── SKILL.md              # 必需：技能定义和说明
├── references/           # 可选：参考文档
│   └── api-docs.md
├── scripts/              # 可选：辅助脚本
│   └── process.py
└── assets/               # 可选：模板和配置
    └── template.json
```

### SKILL.md 格式

```markdown
---
name: skill-name
description: When and why to use this skill
---

# Skill Title

## Instructions

[Detailed instructions in imperative form...]

## Bundled Resources

- references/ - Supporting documentation
- scripts/ - Helper scripts
- assets/ - Templates, configs
```

## 使用技能

### 列出所有技能

```bash
/skills list
```

输出示例：
```
Available Skills:

  pdf                      (project)
    Comprehensive PDF manipulation toolkit...

  xlsx                     (global)
    Spreadsheet creation, editing, and analysis...

Summary: 1 project, 1 global (2 total)
```

### 读取技能内容

```bash
/skills read <skill-name>
```

输出示例：
```
Reading: pdf
Base directory: /path/to/.mini-cc/skills/pdf

---
name: pdf
description: PDF manipulation toolkit
---

# PDF Skill Instructions
[完整的技能说明内容...]

Skill read: pdf
```

## AI 如何使用技能

### 自动发现

AI 可以通过 bash 工具调用技能：

```bash
bash_tool("/skills list")  # 查看可用技能
bash_tool("/skills read pdf")  # 读取技能内容
```

### 工作流程

1. **发现阶段**：AI 列出可用技能
2. **匹配阶段**：根据任务需求选择合适的技能
3. **加载阶段**：读取技能的完整指令
4. **执行阶段**：按照技能指令完成任务

### 示例对话

```
User: 我需要处理一个 PDF 文件

AI: 让我查看可用的技能...
    [执行: /skills list]
    
    我发现有一个 PDF 技能可以帮助你。让我读取它的详细说明...
    [执行: /skills read pdf]
    
    根据技能指导，我将使用以下步骤处理你的 PDF...
```

## 技能编写规范

### 命名规范
- 使用小写字母和连字符
- 描述清晰且具体
- 例如：`pdf-tools`, `database-migration`, `api-testing`

### 内容规范
- **语气**：使用祈使语气（"To do X, execute Y"）
- **长度**：SKILL.md 应少于 5000 字
- **结构**：清晰的章节划分
- **示例**：提供实际的使用示例

### 资源组织
- 将详细内容放到 `references/` 目录
- 辅助脚本放到 `scripts/` 目录
- 模板和配置放到 `assets/` 目录
- 使用相对路径引用资源

## 技能优先级

当多个目录中存在同名技能时，优先级如下（从高到低）：

1. `.mini-cc/skills/` （项目级）
2. `~/.mini-cc/skills/` （全局级）

高优先级的技能会覆盖低优先级的同名技能。

## 最佳实践

### 何时使用技能

- 重复性任务（数据处理、文件转换）
- 专业领域工作（PDF、Excel、数据库）
- 复杂工作流程（部署、测试、迁移）
- 团队协作规范（代码风格、审查流程）

### 技能开发建议

1. **保持专注**：每个技能解决一类问题
2. **提供上下文**：说明何时使用此技能
3. **步骤清晰**：使用编号列表
4. **包含示例**：展示实际用法
5. **维护资源**：保持引用文档的更新

### 项目级 vs 全局级

**项目级技能**适用于：
- 项目特定的工作流程
- 团队共享的规范
- 特定技术栈的工具

**全局技能**适用于：
- 通用的最佳实践
- 跨项目的工具
- 个人习惯和偏好

## 示例技能

### 简单示例

创建一个基本的代码审查技能：

```bash
mkdir -p .mini-cc/skills/code-review
cat > .mini-cc/skills/code-review/SKILL.md << 'EOF'
---
name: code-review
description: Comprehensive code review guidelines and checklist
---

# Code Review Skill

## Instructions

When conducting a code review:

1. Check code style and formatting
2. Verify error handling
3. Review test coverage
4. Check for security issues
5. Validate documentation

## Checklist

- [ ] Code follows project style guide
- [ ] All functions have proper error handling
- [ ] Unit tests cover main paths
- [ ] No hardcoded credentials
- [ ] Public APIs are documented

## References

See `references/style-guide.md` for detailed coding standards.
EOF
```

## 故障排查

### 技能未显示

检查：
1. 目录名称是否正确
2. SKILL.md 文件是否存在
3. YAML frontmatter 格式是否正确
4. name 和 description 字段是否存在

### 技能读取失败

检查：
1. 文件权限是否正确
2. 文件编码是否为 UTF-8
3. 文件路径是否正确

### 优先级问题

使用 `/skills list` 查看实际加载的技能位置，确认优先级是否符合预期。

## 兼容性

本实现完全兼容 Anthropic 的 Skills 规范，遵循相同的格式和约定。

## 相关资源

- [Anthropic Skills 文档](https://docs.anthropic.com/claude/docs/skills)
- [Skills 示例仓库](https://github.com/anthropics/skills)

