# Skills System

Mini Claude Code supports the Anthropic Skills specification, allowing you to install and use skills to extend AI capabilities.

## What are Skills?

Skills are documents containing specialized instructions and resources that help AI better complete specific tasks. Each skill includes:
- Detailed task guidance
- Best practice recommendations
- Helper scripts and templates
- Reference documentation

## Quick Start

### Installing Skills

Skills need to be manually placed in the following directories:

**Project-level skills** (higher priority):
```bash
.mini-cc/skills/
```

**Global skills**:
```bash
~/.mini-cc/skills/
```

### Skill Directory Structure

Each skill must be a directory containing a `SKILL.md` file:

```
my-skill/
├── SKILL.md              # Required: Skill definition and instructions
├── references/           # Optional: Reference documentation
│   └── api-docs.md
├── scripts/              # Optional: Helper scripts
│   └── process.py
└── assets/               # Optional: Templates and configs
    └── template.json
```

### SKILL.md Format

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

## Using Skills

### List All Skills

```bash
/skills list
```

Example output:
```
Available Skills:

  pdf                      (project)
    Comprehensive PDF manipulation toolkit...

  xlsx                     (global)
    Spreadsheet creation, editing, and analysis...

Summary: 1 project, 1 global (2 total)
```

### Read Skill Content

```bash
/skills read <skill-name>
```

Example output:
```
Reading: pdf
Base directory: /path/to/.mini-cc/skills/pdf

---
name: pdf
description: PDF manipulation toolkit
---

# PDF Skill Instructions
[Complete skill instruction content...]

Skill read: pdf
```

## How AI Uses Skills

### Auto-Discovery

AI can invoke skills through the bash tool:

```bash
bash_tool("/skills list")  # View available skills
bash_tool("/skills read pdf")  # Read skill content
```

### Workflow

1. **Discovery Phase**: AI lists available skills
2. **Matching Phase**: Select appropriate skills based on task requirements
3. **Loading Phase**: Read complete skill instructions
4. **Execution Phase**: Complete tasks according to skill instructions

### Example Conversation

```
User: I need to process a PDF file

AI: Let me check available skills...
    [Execute: /skills list]
    
    I found a PDF skill that can help. Let me read its detailed instructions...
    [Execute: /skills read pdf]
    
    Based on the skill guidance, I will process your PDF using these steps...
```

## Skill Writing Guidelines

### Naming Conventions
- Use lowercase letters and hyphens
- Clear and specific descriptions
- Examples: `pdf-tools`, `database-migration`, `api-testing`

### Content Guidelines
- **Tone**: Use imperative mood ("To do X, execute Y")
- **Length**: SKILL.md should be under 5000 words
- **Structure**: Clear section divisions
- **Examples**: Provide practical usage examples

### Resource Organization
- Place detailed content in `references/` directory
- Place helper scripts in `scripts/` directory
- Place templates and configs in `assets/` directory
- Use relative paths for resource references

## Skill Priority

When skills with the same name exist in multiple directories, priority is as follows (high to low):

1. `.mini-cc/skills/` (project-level)
2. `~/.mini-cc/skills/` (global-level)

Higher priority skills override lower priority skills with the same name.

## Best Practices

### When to Use Skills

- Repetitive tasks (data processing, file conversion)
- Domain-specific work (PDF, Excel, databases)
- Complex workflows (deployment, testing, migration)
- Team collaboration standards (code style, review process)

### Skill Development Tips

1. **Stay focused**: Each skill solves one type of problem
2. **Provide context**: Explain when to use this skill
3. **Clear steps**: Use numbered lists
4. **Include examples**: Show actual usage
5. **Maintain resources**: Keep referenced documentation updated

### Project-level vs Global-level

**Project-level skills** are suitable for:
- Project-specific workflows
- Team-shared standards
- Technology stack-specific tools

**Global skills** are suitable for:
- General best practices
- Cross-project tools
- Personal habits and preferences

## Example Skill

### Simple Example

Create a basic code review skill:

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

## Troubleshooting

### Skill Not Showing

Check:
1. Is the directory name correct?
2. Does SKILL.md file exist?
3. Is YAML frontmatter format correct?
4. Do name and description fields exist?

### Skill Read Failed

Check:
1. Are file permissions correct?
2. Is file encoding UTF-8?
3. Is file path correct?

### Priority Issues

Use `/skills list` to view actual loaded skill locations and confirm if priority is as expected.

## Compatibility

This implementation is fully compatible with Anthropic's Skills specification, following the same format and conventions.

## Related Resources

- [Anthropic Skills Documentation](https://docs.anthropic.com/claude/docs/skills)
- [Skills Example Repository](https://github.com/anthropics/skills)

