import { Plugin, TFile } from "obsidian";
import { CheckboxUtils } from "./checkboxUtils";
import { FileChangeEventHandler } from "./events/FileChangeEventHandler";
import { FileLoadEventHandler } from "./events/FileLoadEventHandler";
import FileStateHolder from "./FileStateHolder";
import { CheckboxSyncPluginSettingTab } from "./ui/CheckboxSyncPluginSettingTab";
import SyncController from "./SyncController";
import { CheckboxSyncPluginSettings, DEFAULT_SETTINGS } from "./types";

export default class CheckboxSyncPlugin extends Plugin {
  private _settings: CheckboxSyncPluginSettings;

  private syncController: SyncController;
  private checkboxUtils: CheckboxUtils;
  private fileStateHolder: FileStateHolder;
  private fileLoadEventHandler: FileLoadEventHandler;
  private fileChangeEventHandler: FileChangeEventHandler;

  async onload() {
    await this.loadSettings();

    this.fileStateHolder = new FileStateHolder(this.app.vault);
    this.checkboxUtils = new CheckboxUtils(this.settings);
    this.syncController = new SyncController(this.app.vault, this.checkboxUtils, this.fileStateHolder);
    this.fileLoadEventHandler = new FileLoadEventHandler(this, this.app, this.syncController, this.fileStateHolder);
    this.fileChangeEventHandler = new FileChangeEventHandler(this, this.app, this.syncController, this.fileStateHolder);

    this.addSettingTab(new CheckboxSyncPluginSettingTab(this.app, this));
    this.fileLoadEventHandler.registerEvents();
    this.fileChangeEventHandler.registerEvents();
  }

  async loadSettings() {
    this._settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  get settings(): Readonly<CheckboxSyncPluginSettings> {
    return this._settings;
  }

  async updateSettings(callback: (settings: CheckboxSyncPluginSettings) => void | Promise<void>) {
    await callback(this._settings);
    await this.saveData(this.settings);
    //надо пересинхронизировать все файлы в кеше
    const allFile = this.fileStateHolder.getAllFiles();
    await Promise.all(
      allFile.map(async (file: TFile) => {
        await this.syncController.syncFile(file);
      })
    );
  }
}
