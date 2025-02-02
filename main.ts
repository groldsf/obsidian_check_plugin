import { Plugin, Editor } from "obsidian";

export default class CheckboxSyncPlugin extends Plugin {
  async onload() {
    this.registerEvent(
      this.app.workspace.on("editor-change", (editor) => {
        this.updateParentCheckboxes(editor);
      })
    );
  }
  updateParentCheckboxes(editor: Editor) {
    const lines = editor.getValue().split("\n");
    let hasChanges = false;
    const cursor = editor.getCursor();

    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(/^(\s*)- \[(.)\] (.*)$/);
      if (!match) continue;
      
      const indent = match[1].length;
      const isChecked = match[2] === "x";
      let allChildrenChecked = true;
      let hasChildren = false;
      let j = i + 1;

      while (j < lines.length) {
        const childMatch = lines[j].match(/^(\s*)- \[(.)\] (.*)$/);
        if (!childMatch || childMatch[1].length <= indent) break;
        hasChildren = true;
        if (childMatch[2] !== "x") allChildrenChecked = false;
        j++;
      }

      if (hasChildren) {
        if (allChildrenChecked && !isChecked) {
          lines[i] = `${match[1]}- [x] ${match[3]}`;
          hasChanges = true;
        } else if (!allChildrenChecked && isChecked) {
          lines[i] = `${match[1]}- [ ] ${match[3]}`;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      editor.replaceRange(lines.join("\n"), { line: 0, ch: 0 }, { line: editor.lastLine(), ch: editor.getLine(editor.lastLine()).length });
      editor.setCursor(cursor);
    }
  }
}
