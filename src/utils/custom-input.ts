/**
 * Custom input prompt with @ mention support
 * 
 * Features:
 * - Normal text input
 * - Triggers file/folder selection menu when @ is typed
 * - Inserts selected path into input
 */

import * as readline from 'readline';
import chalk from 'chalk';
import { getFileSuggestions, FileSuggestion } from './at-mention';

// Constants
const PICKER_PAGE_SIZE = 10;
const CTRL_D_TIMEOUT_MS = 1500;

// Prevent duplicate keypress event initialization
// Note: This flag intentionally never resets - readline.emitKeypressEvents()
// should only be called once per process to avoid duplicate events
let keypressInitialized = false;

/**
 * Calculate the display width of a string in terminal
 * CJK characters (Chinese, Japanese, Korean) and some other wide characters take 2 columns
 * 
 * @param str - String to calculate width
 * @returns Display width in terminal columns
 */
function getDisplayWidth(str: string): number {
    let width = 0;
    for (const char of str) {
        const code = char.codePointAt(0) || 0;
        // CJK characters and other wide characters
        if (
            (code >= 0x1100 && code <= 0x115F) ||   // Hangul Jamo
            (code >= 0x2E80 && code <= 0x9FFF) ||   // CJK Radicals Supplement to CJK Unified Ideographs
            (code >= 0xAC00 && code <= 0xD7AF) ||   // Hangul Syllables
            (code >= 0xF900 && code <= 0xFAFF) ||   // CJK Compatibility Ideographs
            (code >= 0xFE10 && code <= 0xFE1F) ||   // Vertical forms
            (code >= 0xFE30 && code <= 0xFE6F) ||   // CJK Compatibility Forms
            (code >= 0xFF00 && code <= 0xFF60) ||   // Fullwidth Forms
            (code >= 0xFFE0 && code <= 0xFFE6) ||   // Fullwidth Signs
            (code >= 0x20000 && code <= 0x2FFFF)    // CJK Unified Ideographs Extension B-F
        ) {
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}

/**
 * Input options
 */
export interface InputOptions {
    message: string;
}

/**
 * Exit signal error
 */
export class ExitSignalError extends Error {
    constructor() {
        super('Exit signal received');
        this.name = 'ExitSignalError';
    }
}

/**
 * Input segment result type
 */
type InputSegmentResult = 
    | { type: 'submit'; value: string; cursorPos: number }
    | { type: 'cancel'; value: string; cursorPos: number }
    | { type: 'at-trigger'; value: string; cursorPos: number }
    | { type: 'exit'; value: string; cursorPos: number };

/**
 * Show file picker
 * 
 * @returns Selected file path or null (when cancelled)
 */
async function showFilePicker(): Promise<string | null> {
    return new Promise((resolve) => {
        let searchTerm = '';
        let selectedIndex = 0;
        let suggestions: FileSuggestion[] = [];
        let resolved = false;
        let scrollOffset = 0;

        // Update suggestions list
        const updateSuggestions = () => {
            suggestions = getFileSuggestions(searchTerm);
            selectedIndex = 0;
            scrollOffset = 0;
        };

        updateSuggestions();

        // Initialize keypress events only once
        if (!keypressInitialized) {
            readline.emitKeypressEvents(process.stdin);
            keypressInitialized = true;
        }

        // Total lines: header 3 lines + list PICKER_PAGE_SIZE lines + footer 1 line
        const totalLines = PICKER_PAGE_SIZE + 4;

        // Render picker UI
        const render = (isFirst: boolean = false) => {
            if (!isFirst) {
                // Clear previous output: move up and clear
                process.stdout.write(`\x1b[${totalLines}A`);  // Move up
                process.stdout.write('\x1b[0J');              // Clear below cursor
            }

            // Header
            console.log(chalk.dim('  📂 Select file/folder (type to filter, ↑↓ navigate, Enter select, ESC cancel)'));
            console.log(chalk.cyan('  @ ') + searchTerm + chalk.dim('▌'));
            console.log(chalk.dim('  ' + '─'.repeat(40)));

            // List
            const visibleItems = suggestions.slice(scrollOffset, scrollOffset + PICKER_PAGE_SIZE);
            for (let i = 0; i < PICKER_PAGE_SIZE; i++) {
                const item = visibleItems[i];
                if (item) {
                    const isSelected = (scrollOffset + i) === selectedIndex;
                    const prefix = isSelected ? chalk.cyan(' ❯ ') : '   ';
                    const text = item.displayValue;
                    console.log(prefix + (isSelected ? chalk.cyan(text) : text));
                } else if (i === 0 && visibleItems.length === 0) {
                    console.log(chalk.dim('    No matching files'));
                } else {
                    console.log('');
                }
            }

            // Footer with count
            if (suggestions.length > PICKER_PAGE_SIZE) {
                console.log(chalk.dim(`  (${suggestions.length} items, showing ${scrollOffset + 1}-${Math.min(scrollOffset + PICKER_PAGE_SIZE, suggestions.length)})`));
            } else {
                console.log('');  // Keep line count consistent
            }
        };

        // Initial render
        render(true);

        // Cleanup and return result
        const cleanup = (result: string | null) => {
            if (resolved) return;
            resolved = true;

            process.stdin.removeListener('keypress', keypressHandler);
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(false);
            }

            // Clear picker UI
            process.stdout.write(`\x1b[${totalLines}A`);  // Move up
            process.stdout.write('\x1b[0J');              // Clear below cursor

            resolve(result);
        };

        // Keypress handler
        const keypressHandler = (str: string | undefined, key: readline.Key | undefined) => {
            if (resolved) return;

            if (key) {
                // Enter - select current item
                if (key.name === 'return') {
                    if (suggestions.length > 0 && suggestions[selectedIndex]) {
                        cleanup(suggestions[selectedIndex].value);
                    } else {
                        cleanup(null);
                    }
                    return;
                }

                // ESC or Ctrl+C - cancel
                if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
                    cleanup(null);
                    return;
                }

                // Up arrow
                if (key.name === 'up') {
                    if (selectedIndex > 0) {
                        selectedIndex--;
                        if (selectedIndex < scrollOffset) {
                            scrollOffset = selectedIndex;
                        }
                        render();
                    }
                    return;
                }

                // Down arrow
                if (key.name === 'down') {
                    if (selectedIndex < suggestions.length - 1) {
                        selectedIndex++;
                        if (selectedIndex >= scrollOffset + PICKER_PAGE_SIZE) {
                            scrollOffset = selectedIndex - PICKER_PAGE_SIZE + 1;
                        }
                        render();
                    }
                    return;
                }

                // PageUp
                if (key.name === 'pageup' && suggestions.length > 0) {
                    selectedIndex = Math.max(0, selectedIndex - PICKER_PAGE_SIZE);
                    scrollOffset = Math.max(0, scrollOffset - PICKER_PAGE_SIZE);
                    render();
                    return;
                }

                // PageDown
                if (key.name === 'pagedown' && suggestions.length > 0) {
                    selectedIndex = Math.min(suggestions.length - 1, selectedIndex + PICKER_PAGE_SIZE);
                    scrollOffset = Math.min(
                        Math.max(0, suggestions.length - PICKER_PAGE_SIZE),
                        scrollOffset + PICKER_PAGE_SIZE
                    );
                    render();
                    return;
                }

                // Backspace
                if (key.name === 'backspace') {
                    if (searchTerm.length > 0) {
                        searchTerm = searchTerm.slice(0, -1);
                        updateSuggestions();
                        render();
                    }
                    return;
                }

                // Tab - auto-complete folder
                if (key.name === 'tab') {
                    if (suggestions.length > 0 && suggestions[selectedIndex]) {
                        const item = suggestions[selectedIndex];
                        if (item.type === 'folder') {
                            searchTerm = item.value + '/';
                            updateSuggestions();
                            render();
                        }
                    }
                    return;
                }
            }

            // Normal character input
            if (str && !key?.ctrl && !key?.meta && str.length === 1 && str.charCodeAt(0) >= 32) {
                searchTerm += str;
                updateSuggestions();
                render();
            }
        };

        // Set raw mode
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
        }

        process.stdin.on('keypress', keypressHandler);
    });
}

/**
 * Read input segment until submit, cancel, or @ trigger
 */
function readInputSegment(
    prompt: string,
    initialValue: string,
    initialCursor: number
): Promise<InputSegmentResult> {
    return new Promise((resolve) => {
        let currentInput = initialValue;
        let cursorPos = initialCursor;
        let resolved = false;
        
        // Ctrl+D state - local to each input segment to avoid cross-call issues
        let ctrlDCount = 0;
        let ctrlDTimeout: NodeJS.Timeout | null = null;

        // Ensure stdin state is correct
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }

        // Initialize keypress events only once
        if (!keypressInitialized) {
            readline.emitKeypressEvents(process.stdin);
            keypressInitialized = true;
        }

        // Redraw input line
        const redraw = () => {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(prompt + currentInput);
            // Calculate display width for cursor position
            // cursorPos is the character index, but we need display width
            const textBeforeCursor = currentInput.slice(0, cursorPos);
            const displayOffset = getDisplayWidth(textBeforeCursor);
            readline.cursorTo(process.stdout, prompt.length + displayOffset);
        };

        // Finish and return result
        const finish = (result: InputSegmentResult) => {
            if (resolved) return;
            resolved = true;

            process.stdin.removeListener('keypress', keypressHandler);
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(false);
            }
            resolve(result);
        };

        // Keypress handler
        const keypressHandler = (str: string | undefined, key: readline.Key | undefined) => {
            if (resolved) return;

            if (key) {
                // Enter - submit
                if (key.name === 'return') {
                    finish({ type: 'submit', value: currentInput, cursorPos });
                    return;
                }

                // Ctrl+C - cancel
                if (key.ctrl && key.name === 'c') {
                    finish({ type: 'cancel', value: currentInput, cursorPos });
                    return;
                }

                // Ctrl+D - press twice to exit
                if (key.ctrl && key.name === 'd') {
                    // Clear previous timeout
                    if (ctrlDTimeout) {
                        clearTimeout(ctrlDTimeout);
                    }
                    
                    // If already pressed once, exit immediately
                    if (ctrlDCount >= 1) {
                        ctrlDCount = 0;
                        finish({ type: 'exit', value: currentInput, cursorPos });
                        return;
                    }
                    
                    // First press, increment count and show hint
                    ctrlDCount++;
                    process.stdout.write(chalk.dim(' (Press Ctrl+D again to exit)'));
                    
                    // Reset count after timeout
                    ctrlDTimeout = setTimeout(() => {
                        ctrlDCount = 0;
                        redraw();
                    }, CTRL_D_TIMEOUT_MS);
                    return;
                }

                // ESC - cancel
                if (key.name === 'escape') {
                    finish({ type: 'cancel', value: currentInput, cursorPos });
                    return;
                }

                // Backspace
                if (key.name === 'backspace') {
                    if (cursorPos > 0) {
                        const before = currentInput.slice(0, cursorPos - 1);
                        const after = currentInput.slice(cursorPos);
                        currentInput = before + after;
                        cursorPos--;
                        redraw();
                    }
                    return;
                }

                // Delete
                if (key.name === 'delete') {
                    if (cursorPos < currentInput.length) {
                        const before = currentInput.slice(0, cursorPos);
                        const after = currentInput.slice(cursorPos + 1);
                        currentInput = before + after;
                        redraw();
                    }
                    return;
                }

                // Left arrow
                if (key.name === 'left') {
                    if (cursorPos > 0) {
                        cursorPos--;
                        redraw();
                    }
                    return;
                }

                // Right arrow
                if (key.name === 'right') {
                    if (cursorPos < currentInput.length) {
                        cursorPos++;
                        redraw();
                    }
                    return;
                }

                // Home or Ctrl+A
                if (key.name === 'home' || (key.ctrl && key.name === 'a')) {
                    cursorPos = 0;
                    redraw();
                    return;
                }

                // End or Ctrl+E
                if (key.name === 'end' || (key.ctrl && key.name === 'e')) {
                    cursorPos = currentInput.length;
                    redraw();
                    return;
                }

                // Ctrl+U - clear line
                if (key.ctrl && key.name === 'u') {
                    currentInput = '';
                    cursorPos = 0;
                    redraw();
                    return;
                }

                // Ctrl+K - delete to end of line
                if (key.ctrl && key.name === 'k') {
                    currentInput = currentInput.slice(0, cursorPos);
                    redraw();
                    return;
                }
            }

            // Normal character input
            if (str && !key?.ctrl && !key?.meta) {
                const before = currentInput.slice(0, cursorPos);
                const after = currentInput.slice(cursorPos);
                currentInput = before + str + after;
                cursorPos += str.length;
                redraw();

                // Detect @ - trigger file picker
                if (str === '@') {
                    finish({ type: 'at-trigger', value: currentInput, cursorPos });
                }
            }
        };

        // Set raw mode
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
        }

        // Write initial prompt or redraw
        if (initialValue) {
            redraw();
        } else {
            process.stdout.write(prompt);
        }

        process.stdin.on('keypress', keypressHandler);
    });
}

/**
 * Custom input with @ mention support
 * 
 * @param options - Input options
 * @returns User input string
 */
export async function customInput(options: InputOptions): Promise<string> {
    let currentInput = '';
    let cursorPos = 0;
    const prompt = options.message + ' ';

    while (true) {
        const result = await readInputSegment(prompt, currentInput, cursorPos);

        if (result.type === 'submit') {
            console.log();
            return result.value;
        }

        if (result.type === 'cancel') {
            throw Object.assign(new Error('User cancelled'), { name: 'ExitPromptError' });
        }

        if (result.type === 'exit') {
            console.log();
            throw new ExitSignalError();
        }

        if (result.type === 'at-trigger') {
            currentInput = result.value;
            cursorPos = result.cursorPos;

            // Show file picker
            const selectedPath = await showFilePicker();

            if (selectedPath) {
                // Insert selected path at cursor position
                const before = currentInput.slice(0, cursorPos);
                const after = currentInput.slice(cursorPos);
                currentInput = before + selectedPath + ' ' + after;
                cursorPos += selectedPath.length + 1;
            }
            // Continue to next input segment
        }
    }
}

/**
 * Enhanced input wrapper
 * 
 * Falls back to standard input if raw mode fails
 * 
 * @param options - Input options
 * @returns User input string
 */
export async function enhancedInput(options: InputOptions): Promise<string> {
    // Check if in TTY environment
    if (!process.stdin.isTTY) {
        const { input } = await import('@inquirer/prompts');
        return input({ message: options.message });
    }

    try {
        return await customInput(options);
    } catch (error) {
        // Re-throw ExitSignalError (our custom error)
        if (error instanceof ExitSignalError) {
            throw error;
        }
        
        // Re-throw ExitPromptError (from inquirer or our code)
        if (error instanceof Error && error.name === 'ExitPromptError') {
            throw error;
        }

        // Fall back to standard input for other errors
        const { input } = await import('@inquirer/prompts');
        return input({ message: options.message });
    }
}
