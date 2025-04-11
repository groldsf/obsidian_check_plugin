import { App, TFile } from "obsidian";
import CheckboxSyncPlugin from "src/main";
import SyncController from "src/SyncController";

export class FileChangeEventHandler {
  private plugin: CheckboxSyncPlugin;
  private app: App;
  private syncController: SyncController;

  constructor(plugin: CheckboxSyncPlugin, app: App, syncController: SyncController) {
    this.plugin = plugin;
    this.app = app;
    this.syncController = syncController;
  }

  registerEvents() {
    //запуск плагина при модификации файла(для обработки в режиме просмотра)
    this.plugin.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (!(file instanceof TFile)) return;
        if (file.extension !== "md") return;
        console.log(`modify file ${file.path}`);
        await this.syncController.syncFile(file);
      })
    );
    //запуск плагина при изменении в режиме редактора
    this.plugin.registerEvent(
      this.app.workspace.on("editor-change", async (editor, info) => {
        console.log(`editor-change file ${info.file?.path}`);
        await this.syncController.syncEditor(editor, info);
      })
    );
  }
}