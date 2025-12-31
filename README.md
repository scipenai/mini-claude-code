# Mini Claude Code Agent

[English](README.md) | [中文](README_zh.md)

A minimal implementation of the Claude Code CLI coding assistant.

## Overview

Mini Claude Code Agent is a simplified version of Claude Code that allows AI models to interact directly with your codebase through a powerful set of tools. It provides a command-line interface that enables Claude to:

- Read and write files
- Execute shell commands
- Edit text in files
- Navigate project structures

This tool is designed to be used with LLM models to provide an interactive coding experience where the LLM can make direct changes to your codebase.

## Features

- **Coding Assistant**: Uses large language models as the core AI engine
- **File Operations**: Support for reading, writing, and editing files
- **Shell Execution**: Can execute shell commands within the project workspace
- **MCP Integration**: Supports Model Context Protocol, can connect to various MCP servers to extend functionality
- **Skills System**: Support Anthropic Skills specification to install and invoke specialized skills
- **Context Compression**: Intelligent automatic and manual context compression to handle long conversation token limits
- **Real-time Status Bar**: Display MCP connection status and context usage at a glance
- **Security Restrictions**: Prevents path traversal and dangerous command execution
- **Real-time Feedback**: Provides visual feedback during execution
- **Modular Architecture**: Well-organized codebase for easy maintenance and extension

## Tech Stack

- TypeScript
- Node.js
- Anthropic AI SDK
- MCP (Model Context Protocol) SDK

## Prerequisites

- Node.js >= 16.0.0
- Anthropic-compatible API key
- Proxy LLM model

## Quick Start

The fastest way to get started:

1. Set environment variables:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
export ANTHROPIC_BASE_URL="your-anthropic-compatible-api-base-url"
export ANTHROPIC_MODEL="model-name"
```

2. Run directly with npx (no installation needed):

```bash
npx -y @scipen/mini-claude-code
```

That's it! The assistant will start and you can begin interacting with it.

## Installation

```bash
npm install -g @scipen/mini-claude-code
```

Or clone and build from source:

```bash
git clone https://github.com/scipenai/mini-claude-code.git
cd mini-claude-code
npm install
```

## Configuration

Set your Anthropic API key as environment variables:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
export ANTHROPIC_BASE_URL="your-anthropic-compatible-api-base-url"
export ANTHROPIC_MODEL="model-name"
```

## Install Dependencies

```bash
npm install
```

## Build Project

```bash
npm run build
```

## Run Project

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## Usage

After starting the program, you can interact with the code assistant in the terminal:

1. Enter your requirements or questions
2. The assistant will automatically analyze and perform corresponding operations (such as file modifications, command execution, etc.)
3. View execution results and output

Type `exit` or `quit` to exit the program.

### Available Commands

- `/help` - Show help message
- `/clear` - Clear screen
- `/history` - Show conversation history
- `/reset` - Reset conversation history
- `/compact` - Manually compress conversation history to a summary
- `/stats` - Show context usage statistics
- `/save` - Save current conversation to file
- `/load` - Load conversation history from file
- `/todo` - Display todo items status
- `/skills` - Manage and invoke skills (list/read)
- `exit/quit` - Exit the program

### Context Compression

Mini Claude Code supports intelligent context compression to handle long conversation token limits:

- **Automatic Compression**: Automatically triggers when token usage reaches 92%, transparently compressing conversation history into a summary
- **Manual Compression**: Use `/compact` command to manually compress conversation history
- **Statistics View**: Use `/stats` command to view current token usage

For detailed information, please refer to [Context Compression Documentation](docs/CONTEXT_COMPRESSION.md) ([中文](docs/CONTEXT_COMPRESSION_zh.md)).

### Real-time Status Bar

Displays real-time status information after each command:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔌 MCP: 2 │ 🟢 Context: 45% │ 💬 Msgs: 67 │ 🎯 Skills: 3 │ 🤖 Agents: 2      │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **MCP Status**: Shows number of connected MCP servers
- **Context Usage**: Displays context usage percentage with color coding
  - 🟢 Green (0-74%): Normal
  - 🟡 Yellow (75-91%): Warning
  - 🔴 Red (92-100%): Critical (auto-compress soon)
- **Message Count**: Total number of messages in current conversation
- **Skills Count**: Number of installed skills
- **Agents Count**: Number of custom agents (created via `/agents`)

For detailed information, please refer to [Status Bar Documentation](docs/STATUS_BAR.md) ([中文](docs/STATUS_BAR_zh.md)).

## Skills System

Mini Claude Code supports the Anthropic Skills specification, allowing you to install and use skills to extend AI capabilities.

### What are Skills?

Skills are documents containing specialized instructions and resources that help AI better complete specific tasks. For example:
- PDF processing skills
- Excel data analysis skills
- Code review skills
- Database migration skills

### Quick Start

1. Create a skill directory:
```bash
mkdir -p .mini-cc/skills/my-skill
```

2. Create a SKILL.md file:
```bash
cat > .mini-cc/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: Description of what this skill does
---

# My Skill

## Instructions

[Your skill instructions here...]
EOF
```

3. Use in Mini Claude Code:
```bash
/skills list              # List all available skills
/skills read my-skill     # Read skill content
```

For detailed documentation, please refer to:
- [Skills Guide (English)](docs/SKILLS.md)
- [Skills 使用指南 (中文)](docs/SKILLS_zh.md)

## MCP Integration

Mini Claude Code supports Model Context Protocol (MCP), which allows you to connect to various MCP servers to extend functionality.

### Configuring MCP Servers

1. Create a `.mcp.json` file in the project root directory:

```bash
cp .mcp.example.json .mcp.json
```

2. Edit the configuration file to add the MCP servers you need.

Three transport types are supported:
- **stdio**: Local process communication (default)
- **streamable_http**: HTTP remote server (recommended)
- **sse**: Legacy HTTP/SSE (deprecated)

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

For detailed MCP configuration and usage instructions, please refer to:
- [MCP Integration Guide](docs/MCP_GUIDE.md) ([中文](docs/MCP_GUIDE_zh.md))
- [MCP Transport Guide](docs/MCP_TRANSPORT.md) ([中文](docs/MCP_TRANSPORT_zh.md))

### Interaction Example

```
User: Create a new file named hello.js that prints "Hello, World!"
Assistant: I will create a new file named hello.js that prints "Hello, World!".

Tool: write_file
{
  "path": "hello.js",
  "content": "console.log('Hello, World!');\n"
}

Result: wrote 26 bytes to hello.js

I have created the hello.js file with a simple program that prints "Hello, World!" to the console. You can run it with `node hello.js`.
```

## Security

The assistant includes comprehensive security measures:

- **Enhanced Command Detection**: Uses regex-based pattern matching to block dangerous commands
  - File system destruction (`rm -rf /`, `mkfs`, `dd`)
  - Privilege escalation (`sudo`, `su`)
  - System control (`shutdown`, `reboot`, `poweroff`)
  - Remote code execution (`curl | bash`, `wget | sh`)
  - Fork bombs and resource exhaustion
  - And many more (50+ patterns)
- **Path Traversal Prevention**: Restricts file access to the current working directory
- **Timeout Protection**: Default 30-second timeout for all command executions
- **Safe Command Whitelist**: Common development commands bypass checks for better performance
- **Detailed Error Messages**: Clear feedback when commands are blocked

For detailed security information, see [Security Documentation](docs/SECURITY.md)

## Development

### Version Management

This project uses automated scripts for version management. 

Quick reference:

```bash
# Bump version only
npm run version:patch  # 0.5.0 -> 0.5.1
npm run version:minor  # 0.5.1 -> 0.6.0
npm run version:major  # 0.5.1 -> 1.0.0
```

All version numbers are automatically synchronized from `package.json`.

### Adding New Tools

To add a new tool to the assistant:

1. Create a new file in the `src/tools/` directory
2. Implement the tool functionality
3. Add the tool definition to `src/tools/tools.ts`
4. Update the dispatcher in `src/tools/dispatcher.ts` to handle the new tool

### Code Organization

The codebase follows a modular architecture:

- **config**: Configuration and environment variables
- **core**: Core assistant logic and main execution loop
- **tools**: Individual tool implementations and tool management
- **types**: TypeScript type definitions
- **utils**: Utility functions for common operations
- **scripts**: Build and release automation scripts

## Contributing

Contributions are welcome! Feel free to submit Pull Requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- This project is inspired by [shareAI-lab/mini_claude_code](https://github.com/shareAI-lab/mini_claude_code) and [shareAI-lab/Kode](https://github.com/shareAI-lab/Kode)
