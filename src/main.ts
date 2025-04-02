import { MarkdownPostProcessorContext, Plugin, TFile } from "obsidian";
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
      this.app.workspace.on("file-open", this.syncController.syncFile.bind(this.syncController))
    );
    //запуск плагина при модификации файла(для обработки в режиме просмотра)
    this.registerEvent(
      this.app.vault.on("modify", this.syncController.syncFile.bind(this.syncController))
    );
    //запуск плагина при изменении в режиме редактора
    this.registerEvent(
      this.app.workspace.on("editor-change", this.syncController.syncEditor.bind(this.syncController))
    );

    this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      const checkboxes = el.querySelectorAll('input[type="checkbox"].task-list-item-checkbox');
      console.log(`find ${checkboxes.length} checkboxes`)
      checkboxes.forEach((checkbox) => {
        const line = checkbox.getAttribute('data-line');
        checkbox.addEventListener('click', async (event) => {
          const isChecked = (event.target as HTMLInputElement).checked;
          console.log(`Checkbox changed in Reading Mode. Checked: ${isChecked}.`);
          console.log(`Line: ${line}. DocId ${ctx.docId}. SourcePath ${ctx.sourcePath}.`);
          this.syncController.addClickEvent({filePath: ctx.sourcePath, line: Number(line)});
          
          
        }, { capture: true });
      });
    });

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