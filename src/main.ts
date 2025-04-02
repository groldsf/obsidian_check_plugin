import { MarkdownPostProcessorContext, Plugin, TFile } from "obsidian";
import { CheckboxUtils } from "./checkboxUtils";
import { CheckboxSyncPluginSettingTab } from "./CheckboxSyncPluginSettingTab";
import { CheckboxSyncPluginSettings } from "./types";
import SyncController from "./SyncController";
import FileStateHolder from "./FileStateHolder";

const DEFAULT_SETTINGS: CheckboxSyncPluginSettings = {
  xOnlyMode: true,
};

export default class CheckboxSyncPlugin extends Plugin {
  settings: CheckboxSyncPluginSettings;

  syncController: SyncController;
  checkboxUtils: CheckboxUtils;
  fileStateHolder: FileStateHolder;

  async onload() {
    await this.loadSettings();

    this.fileStateHolder = new FileStateHolder(this);
    await this.fileStateHolder.init();
    this.checkboxUtils = new CheckboxUtils(this.settings);
    this.syncController = new SyncController(this);


    this.addSettingTab(new CheckboxSyncPluginSettingTab(this.app, this));

    //запуск плагина при открытии файла
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        console.log(`file-open ${file?.path}`);
        this.syncController.syncFile(file);
      })
    );
    //запуск плагина при модификации файла(для обработки в режиме просмотра)
    this.registerEvent(
      this.app.vault.on("modify", async(file) => {
        if (file instanceof TFile && file.extension === "md") {
          console.log(`modify ${file?.path}, extention ${file.extension}`);
          await this.syncController.syncFile(file);          
        }
      })
    );
    //запуск плагина при изменении в режиме редактора
    this.registerEvent(
      this.app.workspace.on("editor-change", async(editor, info)=>{
        // this.syncController.flushChangeIfNeeded(editor, info);
        // console.log(`editor-change ${info.file?.path}`);
        await this.syncController.syncEditor(editor, info);
      })
    );

    // this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    //   const checkboxes = el.querySelectorAll('input[type="checkbox"].task-list-item-checkbox');
    //   console.log(`find ${checkboxes.length} checkboxes`)
    //   checkboxes.forEach((checkbox) => {
    //     const line = checkbox.getAttribute('data-line');
    //     checkbox.addEventListener('click', async (event) => {
    //       const isChecked = (event.target as HTMLInputElement).checked;
    //       console.log(`Checkbox changed in Reading Mode. Checked: ${isChecked}.`);
    //       console.log(`Line: ${line}. DocId ${ctx.docId}. SourcePath ${ctx.sourcePath}.`);
    //       this.syncController.addClickEvent({ filePath: ctx.sourcePath, line: Number(line) });


    //     }, { capture: true });
    //   });
    // });

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