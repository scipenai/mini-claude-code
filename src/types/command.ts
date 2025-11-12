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
 * Local command - executes synchronously and returns a string result
 */
export interface LocalCommand extends BaseCommand {
    type: 'local';
    call(args: string, context?: any): Promise<string>;
}

/**
 * Local JSX command - renders React components
 */
export interface LocalJSXCommand extends BaseCommand {
    type: 'local-jsx';
    call(onDone: (result?: string) => void, context?: any): Promise<any>;
}

/**
 * Union type for all commands
 */
export type Command = PromptCommand | LocalCommand | LocalJSXCommand;

