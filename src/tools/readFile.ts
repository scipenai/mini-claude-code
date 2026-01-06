import fs from 'fs';
import { safePath } from '../utils/file-helpers';
import { clampText } from '../utils/text-helpers';
import { MAX_TOOL_RESULT_CHARS } from '../config/environment';
import type { ReadFileToolInput } from '../types';

export function runRead(inputObj: ReadFileToolInput): string {
    const filePath = safePath(inputObj.path);
    const text = fs.readFileSync(filePath, 'utf-8');
    const lines = text.split('\n');

    let start = 0;
    if (inputObj.start_line !== undefined) {
        start = Math.max(1, inputObj.start_line) - 1;
    }

    let end = lines.length;
    if (inputObj.end_line !== undefined) {
        const endVal = inputObj.end_line;
        end = endVal < 0 ? lines.length : Math.max(start, endVal);
    }

    const resultText = lines.slice(start, end).join('\n');
    const maxChars = inputObj.max_chars || MAX_TOOL_RESULT_CHARS;
    return clampText(resultText, maxChars);
}