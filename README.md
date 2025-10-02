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
- [MCP Integration Guide](docs/MCP_GUIDE.md)
- [MCP Transport Guide](docs/MCP_TRANSPORT.md)

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

The assistant includes several security measures:

- Blocks dangerous commands like `rm -rf /`, `shutdown`, `reboot`, and `sudo`
- Restricts file access to the current working directory
- Implements timeout mechanisms for command execution

## Project Structure

```
src/
├── config/              # Configuration and environment variables
│   ├── environment.ts    # Environment configuration
│   └── mcp-config.ts     # MCP server configuration
├── core/                # Core assistant logic
│   ├── agent.ts          # Main assistant logic
│   ├── mcp-client.ts     # MCP client manager
│   └── spinner.ts        # CLI spinner for visual feedback
├── tools/               # Tool implementations
│   ├── bash.ts           # Shell command execution
│   ├── dispatcher.ts     # Tool dispatcher
│   ├── editText.ts       # Text editing operations
│   ├── readFile.ts       # File reading operations
│   ├── tools.ts          # Tool definitions
│   └── writeFile.ts      # File writing operations
├── types/               # TypeScript type definitions
│   └── index.ts          # Shared TypeScript interfaces
├── utils/               # Utility functions
│   ├── file-helpers.ts   # File utilities
│   ├── logger.ts         # Logging utilities
│   └── text-helpers.ts   # Text processing utilities
└── index.ts             # Main program entry

dist/                     # Compiled JavaScript files
package.json              # Project configuration and dependencies
package-lock.json         # Dependency lock file
tsconfig.json             # TypeScript configuration
```

## Development

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
