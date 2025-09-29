import { prettyToolLine, prettySubLine } from '../utils/logger';
import { clampText } from '../utils/text-helpers';
import { runBash } from './bash';
import { runRead } from './readFile';
import { runWrite } from './writeFile';
import { runEdit } from './editText';

// ---------- Tool Dispatcher ----------
export function dispatchTool(toolUse: any): any {
    try {
        const name = toolUse.name;
        const inputObj = toolUse.input || {};
        const toolUseId = toolUse.id;

        if (name === "bash") {
            prettyToolLine("Bash", inputObj.command);
            const out = runBash(inputObj);
            prettySubLine(clampText(out, 2000) || "(No content)");
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "read_file") {
            prettyToolLine("Read", inputObj.path);
            const out = runRead(inputObj);
            prettySubLine(clampText(out, 2000));
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "write_file") {
            prettyToolLine("Write", inputObj.path);
            const out = runWrite(inputObj);
            prettySubLine(out);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "edit_text") {
            const action = inputObj.action;
            const pathValue = inputObj.path;
            prettyToolLine("Edit", `${action} ${pathValue}`);
            const out = runEdit(inputObj);
            prettySubLine(out);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        return {
            type: "tool_result",
            tool_use_id: toolUseId,
            content: `unknown tool: ${name}`,
            is_error: true
        };
    } catch (error: any) {
        const toolUseId = toolUse.id;
        return {
            type: "tool_result",
            tool_use_id: toolUseId,
            content: error.message,
            is_error: true
        };
    }
}