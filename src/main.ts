import { Plugin, TFile } from "obsidian";
import { CheckboxUtils } from "./checkboxUtils";
import { CheckboxSyncPluginSettingTab } from "./CheckboxSyncPluginSettingTab";
import { CheckboxSyncPluginSettings } from "./types";
import SyncController from "./SyncController";

const DEFAULT_SETTINGS: CheckboxSyncPluginSettings = {
  xOnlyMode: true,
};

export default class CheckboxSyncPlugin extends Plugin {
  settings: CheckboxSyncPluginSettings;

  syncController: SyncController;
  checkboxUtils: CheckboxUtils;

  async onload() {
    await this.loadSettings();

    this.checkboxUtils = new CheckboxUtils(this.settings);
    this.syncController = new SyncController(this);

    this.addSettingTab(new CheckboxSyncPluginSettingTab(this.app, this));

    //запуск плагина при открытии файла
    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => await this.syncController.syncFile(file))
    );
    //запуск плагина при модификации файла(для обработки в режиме просмотра)
    this.registerEvent(
      this.app.vault.on("modify", async (file: TFile) => await this.syncController.syncFile(file))
    );
    //запуск плагина при изменении в режиме редактора
    this.registerEvent(
      this.app.workspace.on("editor-change", async (editor) => await this.syncController.syncEditor(editor))
    );

  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.checkboxUtils.updateSettings(this.settings);
    const activeFile = this.app.workspace.getActiveFile();
    await this.syncController.syncFile(activeFile);
  }
}