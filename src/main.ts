import { Plugin, TFile } from "obsidian";
import { syncCheckboxes } from "./checkboxUtils";

export default class CheckboxSyncPlugin extends Plugin {
  private isProcessing = false;

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
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (this.isProcessing || !(file instanceof TFile) || file.extension !== "md") return;

        this.isProcessing = true;
        try {
          await this.syncFileCheckboxes(file);
        } finally {
          this.isProcessing = false;
        }
      })
    );
  }

  async syncFileCheckboxes(file: TFile) {
    const text = await this.app.vault.read(file);
    const updates = syncCheckboxes(text);
    if (updates.length === 0) return;

    const lines = text.split("\n");
    updates.forEach(({ line, ch, value }) => {
      lines[line] = lines[line].substring(0, ch) + value + lines[line].substring(ch + 1);
    });

    const updatedText = lines.join("\n");
    await this.app.vault.modify(file, updatedText);
  }
}