import { Command } from '../types/command';
import initCommand from './init';
import skillsCommand from './skills';
import agentsCommand from './agents';

/**
 * Built-in commands registry
 * Add new commands here
 */
const BUILT_IN_COMMANDS: Command[] = [
    initCommand,
    skillsCommand,
    agentsCommand,
];

/**
 * Get all available commands
 */
export function getCommands(): Command[] {
    return BUILT_IN_COMMANDS.filter(cmd => cmd.isEnabled);
}

/**
 * Check if a command exists
 */
export function hasCommand(commandName: string): boolean {
    const commands = getCommands();
    return commands.some(
        cmd => cmd.userFacingName() === commandName || cmd.aliases?.includes(commandName)
    );
}

/**
 * Get a specific command by name
 */
export function getCommand(commandName: string): Command | null {
    const commands = getCommands();
    const command = commands.find(
        cmd => cmd.userFacingName() === commandName || cmd.aliases?.includes(commandName)
    );
    return command || null;
}

/**
 * Get command names for help display
 * Only returns AI-powered commands (prompt type)
 */
export function getCommandNames(): string[] {
    return getCommands()
        .filter(cmd => cmd.type === 'prompt')
        .map(cmd => cmd.userFacingName());
}

