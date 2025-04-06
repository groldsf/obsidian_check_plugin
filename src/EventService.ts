import { App, MarkdownPostProcessorContext, MarkdownRenderer, MarkdownView, TFile, WorkspaceLeaf } from "obsidian";
import CheckboxSyncPlugin from "./main";
import SyncController from "./SyncController";
import FileStateHolder from "./FileStateHolder";
import { text } from "stream/consumers";

export default class EventService {

  private plugin: CheckboxSyncPlugin;
  private app: App;
  private syncController: SyncController;
  private fileStateHolder: FileStateHolder;

  constructor(plugin: CheckboxSyncPlugin, app: App, syncController: SyncController, fileStateHolder: FileStateHolder) {
    this.plugin = plugin;
    this.app = app;
    this.syncController = syncController;
    this.fileStateHolder = fileStateHolder;

  }

  registerEvents() {
    //запуск плагина при открытии файла
    this.plugin.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        if (file) {
          console.log(`file-open ${file.path}`);
          const isUpdate = await this.fileStateHolder.updateIfNeeded(file);
          if (isUpdate) {
            await this.syncController.syncFile(file);
          }
        }
      })
    );
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

    this.plugin.registerMarkdownPostProcessor(async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      console.log(`MarkdownPostProcessor "${ctx.sourcePath}"`);
      const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
      if (file instanceof TFile) {
        const isUpdate = await this.fileStateHolder.updateIfNeeded(file);
        if (isUpdate) {
          await this.syncController.syncFile(file);
        }
      }
    });

    this.plugin.registerEvent(
      this.app.workspace.on('quick-preview', async (file: TFile, data: string) => {
        const isUpdate = await this.fileStateHolder.updateIfNeeded(file, data);
        if (isUpdate) {
          await this.syncController.syncFile(file);
        }
      })
    );

    this.plugin.app.workspace.onLayoutReady(async () => {
      await this.loadAndSyncActiveFiles();
    });
  }

  //загрузка в кеш и синхронизация открытых файлов
  async loadAndSyncActiveFiles() {
    const markdownLeaves = this.app.workspace.getLeavesOfType('markdown');
    markdownLeaves.forEach(async (leaf: WorkspaceLeaf) => {
      await this.loadAndSyncActiveFile(leaf);
    });
  }

  private async loadAndSyncActiveFile(leaf: WorkspaceLeaf) {
    const view = leaf.view as MarkdownView;
    if (!view.file) return;

    //вызов ререндера, для кеширования через MarkdownPostProcessor
    await this.rerenderView(view);
  }

  // вызывает рендеринг view
  private async rerenderView(view: MarkdownView) {
    if (!view.file) return;

    if (view.getMode() === 'preview') {
      view.previewMode.rerender();
    } else {
      await MarkdownRenderer.render(
        this.plugin.app,
        view.editor.getValue(),
        document.createElement('div'),
        view.file.path,
        this.plugin
      );
    }
  }
}