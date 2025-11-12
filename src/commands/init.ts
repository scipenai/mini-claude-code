import { PromptCommand } from '../types/command';
import { markProjectOnboardingComplete } from '../utils/project-config';
import { PROJECT_FILE } from '../constants/product';
import Anthropic from '@anthropic-ai/sdk';

/**
 * /init command - Initialize project documentation
 * 
 * This command asks the AI to analyze the codebase and create an AGENTS.md file
 * containing project documentation, build commands, and code style guidelines.
 */
const initCommand: PromptCommand = {
    type: 'prompt',
    name: 'init',
    description: `Initialize a new ${PROJECT_FILE} file with codebase documentation`,
    isEnabled: true,
    isHidden: false,
    progressMessage: 'analyzing your codebase',
    
    userFacingName() {
        return 'init';
    },
    
    async getPromptForCommand(_args: string): Promise<Anthropic.MessageParam[]> {
        // Mark project onboarding as complete
        markProjectOnboardingComplete();
        
        return [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `Please analyze this codebase and create a ${PROJECT_FILE} file containing:

1. **Build/lint/test commands** - especially for running a single test
2. **Code style guidelines** including:
   - Import style (absolute vs relative paths, ordering)
   - Formatting rules (indentation, spacing, line length)
   - Type usage (TypeScript/Python type hints)
   - Naming conventions (variables, functions, classes, files)
   - Error handling patterns
   - Comment style (JSDoc, docstrings, etc.)

The file you create will be given to agentic coding agents (such as yourself) that operate in this repository. Make it about 20 lines long, but you can make it longer if needed.

If there's already a ${PROJECT_FILE}, improve it instead of replacing it completely.

If there are Cursor rules (in .cursor/rules/ or .cursorrules) or Copilot rules (in .github/copilot-instructions.md), make sure to include them in the ${PROJECT_FILE}.

Check the following files for information:
- package.json / pyproject.toml / Cargo.toml (for scripts and dependencies)
- README.md (for project overview)
- .eslintrc / .prettierrc / tsconfig.json (for code style)
- Existing ${PROJECT_FILE} or CLAUDE.md

Create a well-structured, concise ${PROJECT_FILE} that will help AI agents work effectively in this codebase.`,
                    },
                ],
            },
        ];
    },
};

export default initCommand;

