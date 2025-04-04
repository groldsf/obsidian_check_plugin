import { MarkdownPostProcessorContext, MarkdownRenderer, MarkdownView, Plugin, TFile, WorkspaceLeaf } from "obsidian";
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
    this.checkboxUtils = new CheckboxUtils(this.settings);
    this.syncController = new SyncController(this);

    this.addSettingTab(new CheckboxSyncPluginSettingTab(this.app, this));

    //запуск плагина при открытии файла
    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        if (file) {
          console.log(`file-open ${file.path}`);
          await this.fileStateHolder.update(file);
          await this.syncController.syncFile(file);
        }
      })
    );
    //запуск плагина при модификации файла(для обработки в режиме просмотра)
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (!(file instanceof TFile)) return;
        if (file.extension !== "md") return;

        console.log(`modify ${file.path}, extention ${file.extension}`);
        await this.syncController.syncFile(file);
      })
    );
    //запуск плагина при изменении в режиме редактора
    this.registerEvent(
      this.app.workspace.on("editor-change", async (editor, info) => {
        console.log(`editor-change ${info.file?.path}`);
        await this.syncController.syncEditor(editor, info);
      })
    );

    this.registerMarkdownPostProcessor(async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      console.log(`MarkdownPostProcessor ${ctx.sourcePath}`);
      const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
      if (file instanceof TFile) {
        await this.fileStateHolder.updateIfNeeded(file);
      }
    });
    this.registerEvent(
      this.app.workspace.on('quick-preview', async (file: TFile, data: string) => {
        if (!this.fileStateHolder.has(file)) {
          this.fileStateHolder.set(file, data);
        }
      })
    );

    this.app.workspace.onLayoutReady(async () => {
      await this.updateActiveFiles();
    });

  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.checkboxUtils.updateSettings(this.settings);
    await this.updateActiveFiles();
  }

  async updateActiveFiles() {
    const markdownLeaves = this.app.workspace.getLeavesOfType('markdown');
    markdownLeaves.forEach(async (leaf: WorkspaceLeaf) => {
      const view = leaf.view as MarkdownView;
      if (!view.file) return;
      console.log(`${view.file?.basename} mod ${view.getMode()}`)
      if (view.getMode() === 'preview') {
        console.log(`rerender ${view.file.basename}`);
        view.previewMode.rerender();
      } else {
        const content = view.editor.getValue();
        const tempEl = document.createElement('div');
        await MarkdownRenderer.render(
          this.app,
          content,
          tempEl,
          view.file!.path,
          this
        );
      }
      await this.syncController.syncFile(view.file);
    });
  }
}