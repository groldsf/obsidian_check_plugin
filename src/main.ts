import { Plugin, TFile } from "obsidian";
import { CheckboxUtils } from "./checkboxUtils";
import { CheckboxSyncPluginSettingTab } from "./CheckboxSyncPluginSettingTab";
import { CheckboxSyncPluginSettings } from "./types";

const DEFAULT_SETTINGS: CheckboxSyncPluginSettings = {
  xOnlyMode: true,
};

export default class CheckboxSyncPlugin extends Plugin {
  settings: CheckboxSyncPluginSettings;

  private isProcessing = false;
  checkboxUtils: CheckboxUtils;

  async onload() {
    await this.loadSettings();
    this.checkboxUtils = new CheckboxUtils(this.settings);
    this.addSettingTab(new CheckboxSyncPluginSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        if (this.isProcessing || !(file instanceof TFile) || file.extension !== "md") return;
        
        this.isProcessing = true;
        try {
          await this.syncFileCheckboxes(file);
        } finally {
          this.isProcessing = false;
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on("editor-change", (editor) => {
        const updates = this.checkboxUtils.syncCheckboxes(editor.getValue());
        if (updates.length === 0) return;

        const firstUpdateLine = updates[0].line;
        editor.setCursor({ line: firstUpdateLine, ch: editor.getLine(firstUpdateLine).length });
        editor.blur();

        updates.forEach(({ line, ch, value }) => {
          editor.replaceRange(value, { line, ch }, { line, ch: ch + 1 });
        });
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
    const updates = this.checkboxUtils.syncCheckboxes(text);
    if (updates.length === 0) return;

    const lines = text.split("\n");
    updates.forEach(({ line, ch, value }) => {
      lines[line] = lines[line].substring(0, ch) + value + lines[line].substring(ch + 1);
    });

    const updatedText = lines.join("\n");
    await this.app.vault.modify(file, updatedText);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.checkboxUtils.updateSettings(this.settings);

    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile instanceof TFile && activeFile.extension === "md") {
      await this.syncFileCheckboxes(activeFile);
    }
  }
}