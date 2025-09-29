import fs from 'fs';
import path from 'path';
import { safePath } from '../utils/file-helpers';
import { WORKDIR } from '../config/environment';

export function runWrite(inputObj: any): string {
    const filePath = safePath(inputObj.path);
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    const content = inputObj.content || "";
    const mode = inputObj.mode;

    if (mode === "append" && fs.existsSync(filePath)) {
        fs.appendFileSync(filePath, content, 'utf-8');
    } else {
        fs.writeFileSync(filePath, content, 'utf-8');
    }

    const bytesLen = Buffer.byteLength(content, 'utf-8');
    const rel = path.relative(WORKDIR, filePath);
    return `wrote ${bytesLen} bytes to ${rel}`;
}