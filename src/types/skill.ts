/**
 * 技能相关的类型定义
 */

/**
 * 技能位置类型
 */
export type SkillLocationType = 'project' | 'global';

/**
 * 技能信息（用于列表显示）
 */
export interface Skill {
    /** 技能名称（目录名） */
    name: string;
    /** 技能描述（从 YAML frontmatter 提取） */
    description: string;
    /** 安装位置 */
    location: SkillLocationType;
    /** 技能目录完整路径 */
    path: string;
}

/**
 * 技能位置信息（用于读取）
 */
export interface SkillLocation {
    /** SKILL.md 文件路径 */
    path: string;
    /** 技能目录路径 */
    baseDir: string;
    /** 来源目录（搜索目录之一） */
    source: string;
}

/**
 * 技能元数据（YAML frontmatter）
 */
export interface SkillMetadata {
    name: string;
    description: string;
    context?: string;
}

