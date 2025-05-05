---
title: Roadmap
nav_order: 4
---
# Roadmap

This document outlines the development status and future plans for the Checkbox Sync plugin. It is divided into the main focus for the **upcoming release** and a backlog of **ideas for future versions**.

*(Note: This roadmap is tentative and priorities may shift.)*

## Next Release Candidates

*This section lists the main features and technical work currently planned or in progress for the next release.*

*   [Feature] **File/Folder Scope Filter:** Implement settings to include or exclude specific files or folders where the plugin should be active.
*   [Feature] **Logging Toggle:** Add a setting to enable/disable detailed logging for debugging purposes.
*   [Feature] **Support Non-Checkbox Nodes:** Allow regular list items (e.g., `- Parent Item` without `[ ]`) to function as structural nodes within the hierarchy for synchronization logic.
*   [Feature] **Configurable Checkbox Character (Auto-Update):** Add a setting to define which character is used to mark checkboxes when automatically updated by the plugin.
*   [Tech] **Overhaul List Parsing Logic:** Replace the current line-based parsing with a more robust tree-based approach to improve accuracy and maintainability.

## Future Ideas / Backlog

*   [Feature] **List Reordering Functionality:** Explore and potentially implement list item reordering features, possibly inspired by approaches like [obsidian-checkboxReorder](https://github.com/Erl-koenig/obsidian-checkboxReorder) (e.g., moving completed items).
*   [Tech] **Improve Change Detection:** Investigate using a library like `jsdiff` to more accurately detect and react to specific changes within files, potentially improving performance and reliability.
*   [Tech] **Refactor Settings Handling:** Change how settings are used internally. Instead of passing the settings object by reference, create a new instance of `CheckboxUtils` (or relevant class) when settings are modified to ensure proper state isolation and updates.

---

*Contributions and suggestions are welcome! Please open an issue to discuss these items or suggest new ones.*