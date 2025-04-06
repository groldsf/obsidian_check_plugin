import { Plugin } from "obsidian";
import { CheckboxSyncPluginSettingTab } from "./CheckboxSyncPluginSettingTab";
import { CheckboxUtils } from "./checkboxUtils";
import EventService from "./EventService";
import FileStateHolder from "./FileStateHolder";
import SyncController from "./SyncController";
import { CheckboxSyncPluginSettings } from "./types";

const DEFAULT_SETTINGS: CheckboxSyncPluginSettings = {
  xOnlyMode: true,
};

export default class CheckboxSyncPlugin extends Plugin {
  settings: CheckboxSyncPluginSettings;

  syncController: SyncController;
  checkboxUtils: CheckboxUtils;
  fileStateHolder: FileStateHolder;
  eventService: EventService;

  async onload() {
    await this.loadSettings();

    this.fileStateHolder = new FileStateHolder(this.app.vault);
    this.checkboxUtils = new CheckboxUtils(this.settings);
    this.syncController = new SyncController(this, this.checkboxUtils, this.fileStateHolder);
    this.eventService = new EventService(this, this.app, this.syncController, this.fileStateHolder);

    this.addSettingTab(new CheckboxSyncPluginSettingTab(this.app, this));
    this.eventService.registerEvents();

  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.checkboxUtils.updateSettings(this.settings);
    await this.eventService.loadAndSyncActiveFiles();
  }
}
