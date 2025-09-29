# Mini Claude Code Agent

[English](README.md) | [中文](README_zh.md)

## Overview

Mini Claude Code Agent is a minimal implementation of Claude Code that allows AI models to interact directly with your codebase through a set of powerful tools. It provides a command-line interface that enables Claude to:

- Read and write files
- Execute shell commands
- Edit text within files
- Navigate your project structure

This tool is designed to be used with LLM models to provide an interactive coding experience where LLM can make changes to your codebase directly.

## Features

- **Coding Assistant**: Uses a large language model as the core AI engine
- **File Operations**: Supports reading, writing, and editing files
- **Shell Execution**: Can execute shell commands within the project workspace
- **Security Restrictions**: Prevents path traversal and dangerous command execution
- **Real-time Feedback**: Provides visual feedback during execution
- **Modular Architecture**: Well-organized codebase for easy maintenance and extension

## Tech Stack

- TypeScript
- Node.js
- Anthropic AI SDK

## Prerequisites

- Node.js >= 16.0.0
- An Anthropic compatible API key
- An agentic LLM model

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

Set your Anthropic API key as an environment variable:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
export ANTHROPIC_BASE_URL="your-anthropic-compatable-api-base-url"
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

### Run in Development Mode

```bash
npm run dev
```

### Run in Production Mode

```bash
npm run build
npm start
```

## Usage

After starting the program, you can interact with the code agent in the terminal:

1. Enter your requirements or questions
2. The agent will automatically analyze and perform the corresponding operations (such as file modification, command execution, etc.)
3. View the execution results and output

Type `exit` or `quit` to exit the program.

### Example Interaction

```
User: Create a new file called hello.js that prints "Hello, World!"
Assistant: I'll create a new file called hello.js that prints "Hello, World!".

Tool: write_file
{
  "path": "hello.js",
  "content": "console.log('Hello, World!');\n"
}

Result: wrote 26 bytes to hello.js

I've created the hello.js file with a simple program that prints "Hello, World!" to the console. You can run it with `node hello.js`.
```

## Safety

The agent includes several safety measures:

- Blocks dangerous commands like `rm -rf /`, `shutdown`, `reboot`, and `sudo`
- Restricts file access to the current working directory
- Implements timeouts for command execution

## Project Structure

```
src/
├── config/              # Configuration and environment variables
│   └── environment.ts    # Environment configuration
├── core/                # Core agent logic
│   ├── agent.ts          # Main agent logic
│   ├── spinner.ts        # CLI spinner for visual feedback
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
│   ├── file-helpers.ts   # File utility functions
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

To add a new tool to the agent:

1. Create a new file in the `src/tools/` directory
2. Implement the tool function
3. Add the tool definition to `src/tools/tools.ts`
4. Update the dispatcher in `src/tools/dispatcher.ts` to handle the new tool

### Code Organization

The codebase follows a modular architecture:

- **config**: Configuration and environment variables
- **core**: Core agent logic and main execution loop
- **tools**: Individual tool implementations and tool management
- **types**: TypeScript type definitions
- **utils**: Utility functions for common operations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- This project is inspired by [shareAI-lab/mini_claude_code](https://github.com/shareAI-lab/mini_claude_code) and [shareAI-lab/Kode](https://github.com/shareAI-lab/Kode)
