# User Guide: Storage System

## Overview

The system automatically saves your conversation history, commands, and tasks. Everything is stored locally in your project directory.

## What Gets Saved

- **Conversation History** - All your chats with the AI
- **Command History** - Commands you type
- **TODO Tasks** - Your task lists
- **Session Data** - Separate sessions for different conversations

## Storage Location

All data is saved in your project folder:

```
Your Project/
└── .mini-cc/                      # Storage folder
    ├── messages/                  # Chat history
    ├── history.json               # Your commands
    └── todos-simple.json          # Your tasks
```

## Conversation History

### Automatic Saving
- Every conversation is automatically saved
- Each session has a unique ID
- Includes date, time, and your working directory

### File Naming
Chats are stored as: `2025-01-27T12-00-00-000Z.json`

### Managing History
Your conversations are automatically organized by time. The most recent sessions appear first.

## Command History

### What's Saved
- Every command you type is remembered
- Duplicate consecutive commands are not saved
- Maximum 100 commands are kept

### Storage File
Your command history is saved in: `.mini-cc/history.json`

### Using History
The system automatically recalls your recent commands when you navigate through history.

## TODO Tasks

### What You Can Do
- Create tasks with status: pending, in_progress, completed
- Maximum 20 tasks at a time
- Only one task can be "in_progress" at once

### Storage File
Your tasks are saved in: `.mini-cc/todos-simple.json`

### Task Commands
Use the TODO tool to:
- Add new tasks
- Update task status
- Mark tasks as complete
- Clear all tasks

### Status Display
- ☐ Pending tasks
- 🔄 In progress (only one at a time)
- ☑ Completed tasks

## Data Maintenance

### Back Up Your Data
```bash
# Copy storage folder
cp -r .mini-cc .mini-cc.backup
```

### Clear Storage
```bash
# Remove all saved data (use with caution)
rm -rf .mini-cc
```

### Free Up Space
Old conversations are automatically managed. If you need to free space, you can delete old chat files manually.

## Privacy

- All data is stored locally in your project
- No data is sent to external servers
- Storage is in your project folder only
- Session IDs are anonymous and random

## Troubleshooting

### Storage Not Working
**Solution**: Check if you have write permissions in your project folder

### Lost Conversations
**Solution**: Check the `.mini-cc/messages/` folder for your chat files

### Tasks Not Saving
**Solution**: Ensure your disk isn't full and you have write permissions

### Can't Find History
**Solution**: Look for `.mini-cc/history.json` in your project root

## Best Practices

1. **Regular Backups**: Copy `.mini-cc` folder regularly
2. **Monitor Space**: Check folder size if you have many conversations
3. **Project Organization**: Each project has its own separate storage

## File Locations Summary

| Data Type | Location | File/Folder |
|-----------|----------|-------------|
| Chat History | `.mini-cc/messages/` | JSON files by date |
| Commands | `.mini-cc/` | `history.json` |
| Tasks | `.mini-cc/` | `todos-simple.json` |

## Getting Help

If you encounter issues:
1. Check folder permissions
2. Verify files exist in `.mini-cc/`
3. Restart the application
4. Contact support if problems persist

Remember: Your data is always stored locally and under your control.