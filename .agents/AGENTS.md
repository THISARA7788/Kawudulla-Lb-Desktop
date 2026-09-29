# Custom Rules

- **Explain Before Operating**: Before performing any operation (such as running a command, reading/writing files, or using browser subagents) or requesting permission from the user, the agent must first provide a short description/explanation of that operation so the user can review and approve/deny it.
- **No Native Browser Alerts**: Never use the native JavaScript browser `alert()` function in the frontend code. Always implement errors, warnings, deletes, and success notifications using custom React toast notifications or custom modals to maintain a premium and clean user experience.
