import { Plugin, Editor } from "obsidian";
import { syncCheckboxes } from "./checkboxUtils";

export default class CheckboxSyncPlugin extends Plugin {
  async onload() {
    this.registerEvent(
      this.app.workspace.on("editor-change", (editor) => {
        const updates = syncCheckboxes(editor.getValue());
        if (updates.length > 0) {
          editor.blur();
          updates.forEach(({ line, ch, value }) => {
            editor.replaceRange(value, { line, ch }, { line, ch: ch + 1 });
          });
        }
      })
    );
  }
}
