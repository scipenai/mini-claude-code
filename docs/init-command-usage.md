# /init Command Usage Guide

## Overview

The `/init` command is one of the core features of mini-claude-code. It analyzes your codebase and automatically generates an `AGENTS.md` file that contains:

- Build, test, and run commands
- Code style guidelines
- Project architecture information
- Development workflow instructions

Once created, the contents of `AGENTS.md` are automatically injected into every AI conversation context, helping the AI better understand your project conventions.

## Usage

### 1. First Time Use

Start mini-claude-code in your project root directory:

```bash
cd your-project
mini-claude-code
```

If there's no `AGENTS.md` file in the project yet, you'll see a prompt at startup:

```
💡 Getting started:
   Run /init to create an AGENTS.md file with codebase documentation
   This helps the AI understand your project better
```

### 2. Execute /init Command

At the prompt, type:

```
❯ /init
```

The AI will automatically:
1. Scan project files (package.json, README.md, tsconfig.json, etc.)
2. Analyze code structure and style
3. Check existing Cursor rules or Copilot instructions
4. Generate the `AGENTS.md` file

### 3. View Generated File

After the command completes, an `AGENTS.md` file will appear in the project root directory. Example content:

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

## Key Features

### Automatic Analysis

The AI checks the following files to understand your project:

- `package.json` / `pyproject.toml` / `Cargo.toml` - Dependencies and scripts
- `README.md` - Project overview
- `.eslintrc` / `.prettierrc` / `tsconfig.json` - Code style configuration
- `.cursorrules` / `.cursor/rules/` - Cursor rules
- `.github/copilot-instructions.md` - Copilot instructions

### Smart Improvement

If `AGENTS.md` already exists, the `/init` command will improve the existing content rather than completely replacing it.

### Compatibility

Both `AGENTS.md` and `CLAUDE.md` files are supported:
- Both files will be loaded
- Works fine if only `CLAUDE.md` exists
- `AGENTS.md` is recommended as the primary file

## How It Works

### 1. Context Injection

During each AI conversation, the system will:
1. Read `AGENTS.md` and `CLAUDE.md` (if they exist)
2. Inject the content into the AI's system prompt
3. AI uses this information to guide its work

### 2. Caching Mechanism

- File contents are cached during the session
- Avoids repeated file reads
- Reloaded after program restart

### 3. Onboarding Status

- After executing `/init`, the onboarding prompt no longer appears
- Status is saved in `.mini-cc/project-config.json`

## Advanced Usage

### Manually Edit AGENTS.md

You can directly edit the `AGENTS.md` file to:
- Add specific development conventions
- Supplement project special requirements
- Update commands or workflows

Changes take effect after restarting mini-claude-code.

### Project Templates

Prepare templates for common project types:

**Node.js/TypeScript Project Example:**
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

**Python Project Example:**
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

## Best Practices

### 1. Keep It Concise

- 20-50 lines is the ideal length
- Only include information the AI truly needs
- Use lists and headers to organize content

### 2. Highlight Key Information

Critical information:
- ✅ How to test individual files (high-frequency need)
- ✅ Import path conventions (absolute vs relative)
- ✅ Error handling patterns
- ❌ Overly detailed tech stack explanations
- ❌ Lengthy historical background

### 3. Keep Updated

Update `AGENTS.md` when the project changes:
- Add new build commands
- Update code conventions
- Adjust directory structure descriptions

### 4. Version Control

Include `AGENTS.md` in Git:
```bash
git add AGENTS.md
git commit -m "Add project documentation for AI agents"
```

Team members share the same document to ensure consistent AI behavior.

## Troubleshooting

### AGENTS.md Not Generated

Possible causes:
- AI response was interrupted
- File write permission issues

Solutions:
- Re-run `/init`
- Check directory permissions
- Manually create the `AGENTS.md` file

### AI Not Following Conventions

Possible causes:
- `AGENTS.md` content is not clear enough
- Conventions conflict with AI's system prompts

Solutions:
- Use more explicit language to describe conventions
- Add concrete examples
- Restart mini-claude-code to ensure latest content is loaded

### File Too Large

If `AGENTS.md` exceeds 1MB:
- System will automatically truncate
- Recommend streamlining content and removing redundant information

## Related Commands

- `/help` - View all available commands
- `/clear` - Clear screen
- `/reset` - Clear conversation context (does not affect AGENTS.md)

## Configuration File Locations

- Project documentation: `./AGENTS.md`, `./CLAUDE.md`
- Project configuration: `./.mini-cc/project-config.json`
- Onboarding status stored in project configuration

## Example Workflow

1. **New Project Initialization**
   ```bash
   cd new-project
   mini-claude-code
   # See onboarding prompt
   ❯ /init
   # AI generates AGENTS.md
   ```

2. **Subsequent Conversations**
   ```bash
   ❯ Add error handling to all API calls
   # AI will follow error handling conventions defined in AGENTS.md
   ```

3. **Update Conventions**
   ```bash
   # Edit AGENTS.md
   vim AGENTS.md
   # Restart mini-claude-code
   mini-claude-code
   ```

## Summary

The `/init` command and `AGENTS.md` feature enable the AI to:
- 🎯 Understand project-specific build and test commands
- 📐 Follow project code style conventions
- 🏗️ Understand project architecture and organization
- ⚡ Complete development tasks more efficiently

With a simple `/init` command, make the AI a development partner that truly understands your project!
