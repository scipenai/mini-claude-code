import fs from 'fs';
import { safePath } from '../utils/file-helpers';

export function runEdit(inputObj: any): string {
    const filePath = safePath(inputObj.path);
    let text = fs.readFileSync(filePath, 'utf-8');
    const action = inputObj.action;

    if (action === "replace") {
        const find = inputObj.find || "";
        if (!find) {
            throw new Error("edit_text.replace missing find");
        }
        const replace = inputObj.replace || "";
        const replaced = text.replace(find, replace);
        fs.writeFileSync(filePath, replaced, 'utf-8');
        return `replace done (${Buffer.byteLength(replaced, 'utf-8')} bytes)`;
    } else if (action === "insert") {
        const line = typeof inputObj.insert_after === 'number' ? inputObj.insert_after : -1;
        const lines = text.split('\n');
        const idx = Math.max(-1, Math.min(lines.length - 1, line));
        const newText = inputObj.new_text || "";
        lines.splice(idx + 1, 0, newText);
        const nextText = lines.join('\n');
        fs.writeFileSync(filePath, nextText, 'utf-8');
        return `inserted after line ${line}`;
    } else if (action === "delete_range") {
        const range = inputObj.range || [];
        if (!(range.length === 2 && typeof range[0] === 'number' && typeof range[1] === 'number' && range[1] >= range[0])) {
            throw new Error("edit_text.delete_range invalid range");
        }
        const [s, e] = range;
        const lines = text.split('\n');
        const nextLines = [...lines.slice(0, s), ...lines.slice(e)];
        const nextText = nextLines.join('\n');
        fs.writeFileSync(filePath, nextText, 'utf-8');
        return `deleted lines [${s}, ${e})`;
    } else {
        throw new Error(`unsupported edit_text.action: ${action}`);
    }
}