import fs from 'fs';
import { safePath } from '../utils/file-helpers';
import { clampText } from '../utils/text-helpers';
import { MAX_TOOL_RESULT_CHARS } from '../config/environment';

export function runRead(inputObj: any): string {
    const filePath = safePath(inputObj.path);
    const text = fs.readFileSync(filePath, 'utf-8');
    const lines = text.split('\n');

    let start = 0;
    if (inputObj.start_line) {
        start = Math.max(1, parseInt(inputObj.start_line)) - 1;
    }

    let end = lines.length;
    if (typeof inputObj.end_line === 'number') {
        const endVal = inputObj.end_line;
        end = endVal < 0 ? lines.length : Math.max(start, endVal);
    }

    const resultText = lines.slice(start, end).join('\n');
    const maxChars = inputObj.max_chars || MAX_TOOL_RESULT_CHARS;
    return clampText(resultText, maxChars);
}