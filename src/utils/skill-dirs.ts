/**
 * 技能目录路径管理工具
 */

import { join } from 'path';
import { homedir } from 'os';

/**
 * 获取技能搜索目录列表（按优先级排序）
 * 
 * 优先级从高到低：
 * 1. .mini-cc/skills/ (项目级通用目录)
 * 2. ~/.mini-cc/skills/ (全局通用目录)
 * 
 * @returns 搜索目录路径数组
 */
export function getSearchDirs(): string[] {
    return [
        join(process.cwd(), '.mini-cc/skills'),   // 项目级目录
        join(homedir(), '.mini-cc/skills'),        // 全局目录
    ];
}

/**
 * 判断路径是否为项目级路径
 * 
 * @param path 要检查的路径
 * @returns 是否为项目级路径
 */
export function isProjectLocal(path: string): boolean {
    return path.includes(process.cwd());
}

