# Context Compression Feature

[English](CONTEXT_COMPRESSION.md) | [中文](CONTEXT_COMPRESSION_zh.md)

## Overview

Mini Claude Code now supports an intelligent context compression system to handle AI model token limitations. When conversation history becomes too long, the system can automatically or manually compress the conversation into a summary while preserving key information to ensure continuity in development work.

## Features

### 1. Automatic Compression (Auto-Compact)

- **Trigger Condition**: Automatically triggers when token usage reaches 92% of the model's context limit
- **Trigger Timing**: Automatically checks before each user query
- **Execution Process**:
  1. Detects token usage exceeding 92%
  2. Automatically calls AI to generate conversation summary
  3. Clears historical messages, retains summary
  4. Continues conversation transparently

### 2. Manual Compression (Manual Compact)

- **Trigger Method**: User executes `/compact` command
- **Use Cases**:
  - User actively cleans conversation history
  - Organizing context before starting new tasks
  - Reducing unnecessary token consumption

### 3. Context Statistics (Context Stats)

- **Trigger Method**: User executes `/stats` command
- **Displayed Information**:
  - Current message count
  - Estimated token usage
  - Usage percentage
  - Tokens remaining until auto-compression
  - Current status (normal / approaching limit)

## Usage

### View Context Statistics

```bash
❯ /stats
```

Example output:
```
ℹ️  📊 Context Statistics:
   Messages: 25
   Tokens: ~45000 / 200000
   Usage: 23%
   Remaining: ~139000 tokens until auto-compact
   Status: ✅ OK
```

### Manual Compression

```bash
❯ /compact
```

System will:
1. Display current conversation statistics
2. Call AI to generate structured summary
3. Replace history with compressed summary
4. Display compression results (message count, token savings, etc.)

Example output:
```
ℹ️  📊 Current conversation: 25 messages, ~45000 tokens
ℹ️  🔄 Compressing conversation history...
✅ Context compressed successfully!
   Messages: 25 → 2
   Tokens: ~45000 → ~3500 (saved ~41500 tokens)
```

### Automatic Compression

Automatic compression is completely transparent and requires no user intervention. When token usage reaches 92%, the system will:

```
ℹ️  🔄 Context limit approaching, initiating automatic compression...
✅ Context compressed: 50 messages → 2 messages
   Token usage: 184000 → 4200 (saved 179800 tokens)
```

## Compression Principles

### Token Counting

The system uses heuristic algorithms to estimate token count:
- English text: ~0.25 tokens/character
- Includes all message types: tool usage, tool results, etc.
- Provides conservative estimates to ensure staying within limits

### Summary Generation

During compression, AI generates a structured summary with 8 sections:

1. **Technical Context**
   - Development environment, tools, frameworks, configurations

2. **Project Overview**
   - Project goals, features, scope

3. **Code Changes**
   - Files created/modified/analyzed

4. **Debugging & Issues**
   - Problems encountered and solutions

5. **Current Status**
   - Recently completed work, current state

6. **Pending Tasks**
   - To-do items, priorities

7. **User Preferences**
   - Coding style, communication preferences

8. **Key Decisions**
   - Important technical decisions and reasoning

This structured summary ensures all key information is retained, allowing AI to continue work seamlessly.

## Configuration

### Context Limit

Default context limit is 200,000 tokens. If your model has a different limit, modify in `src/utils/context-compression.ts`:

```typescript
const DEFAULT_CONTEXT_LIMIT = 200_000;  // Change to your model's limit
```

### Auto-Compression Threshold

Default triggers at 92% usage. To adjust:

```typescript
const AUTO_COMPACT_THRESHOLD_RATIO = 0.92;  // Change to 0.85 to trigger at 85%
```

## Best Practices

1. **Regular Statistics Check**: Use `/stats` command to understand current token usage

2. **Manual Compression Before Task Switching**: Use `/compact` to clean history before starting new major tasks

3. **Trust Auto-Compression**: Auto-compression preserves all key information, no need to worry about losing important context

4. **Segment Long Sessions**: For very long development sessions, consider segmenting and manually compressing at the end of each phase

## Technical Implementation

### File Structure

- `src/utils/tokens.ts` - Token counting utilities
- `src/utils/context-compression.ts` - Compression core logic
- `src/core/agent.ts` - Integrated auto-compression checks
- `src/index.ts` - Manual compression commands

### Core Functions

- `countTotalTokens(messages)` - Calculate total tokens
- `shouldAutoCompact(messages)` - Determine if auto-compression is needed
- `executeAutoCompact(messages)` - Execute auto-compression
- `executeManualCompact(messages)` - Execute manual compression
- `getContextStats(messages)` - Get statistics information

## Troubleshooting

### Compression Failure

If compression fails, the system will:
- Display error message
- Retain original message list
- Continue normal operation

### Inaccurate Token Estimation

Token estimation uses heuristic algorithms and may vary ±10% from actual values. This is normal, and the system is designed to err on the conservative side to ensure safety.

### Lost Context After Compression

If you find the AI has lost some important context after compression:
- Provide relevant information again in your next query
- Consider using `/reset` to completely reset the conversation
- Adjust auto-compression threshold to trigger later

## Related Documentation

- [Status Bar Feature](STATUS_BAR.md) - Real-time status display
- [README](../README.md) - Main project documentation
- [Reference Implementation](../context_compression.txt) - Reference implementation document

## Example

For detailed usage examples, please see [Context Compression Demo](../examples/context-compression-demo.md).
