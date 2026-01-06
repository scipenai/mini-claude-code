import Anthropic from '@anthropic-ai/sdk';

/**
 * Command types
 */
export type CommandType = 'prompt' | 'local' | 'local-jsx';

/**
 * Base command interface
 */
export interface BaseCommand {
    type: CommandType;
    name: string;
    description: string;
    isEnabled: boolean;
    isHidden: boolean;
    aliases?: string[];
    userFacingName(): string;
}

/**
 * Prompt command - generates prompts for AI to process
 */
export interface PromptCommand extends BaseCommand {
    type: 'prompt';
    progressMessage?: string;
    argNames?: string[];
    getPromptForCommand(args: string): Promise<Anthropic.MessageParam[]>;
}

/**
 * Command context
 */
export interface CommandContext {
    [key: string]: unknown;
}

/**
 * Local command - executes synchronously and returns a string result
 */
export interface LocalCommand extends BaseCommand {
    type: 'local';
    call(args: string, context?: CommandContext): Promise<string>;
}

/**
 * JSX render result
 */
export type JSXRenderResult = unknown;

/**
 * Local JSX command - renders React components
 */
export interface LocalJSXCommand extends BaseCommand {
    type: 'local-jsx';
    call(onDone: (result?: string) => void, context?: CommandContext): Promise<JSXRenderResult>;
}

/**
 * Union type for all commands
 */
export type Command = PromptCommand | LocalCommand | LocalJSXCommand;

