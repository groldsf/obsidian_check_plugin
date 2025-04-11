import { Mutex } from "async-mutex";
import { App, MarkdownPostProcessorContext, MarkdownRenderer, MarkdownView, TFile, WorkspaceLeaf } from "obsidian";
import FileStateHolder from "src/FileStateHolder";
import CheckboxSyncPlugin from "src/main";
import SyncController from "src/SyncController";


export class FileLoadEventHandler {
  private plugin: CheckboxSyncPlugin;
  private app: App;
  private syncController: SyncController;
  private fileStateHolder: FileStateHolder;
  private markdownPostProcessorMutex: Mutex;//для более последовательной обработки файлов в постпроцессоре. но вообще это лишь замедляет плагин

  constructor(plugin: CheckboxSyncPlugin, app: App, syncController: SyncController, fileStateHolder: FileStateHolder) {
    this.plugin = plugin;
    this.app = app;
    this.syncController = syncController;
    this.fileStateHolder = fileStateHolder;
    this.markdownPostProcessorMutex = new Mutex();
  }

  registerEvents() {
    //запуск плагина при открытии файла
    this.plugin.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        if (file) {
          console.log(`file-open ${file.path}`);
          const isUpdate = await this.fileStateHolder.initIfNeeded(file);
          if (isUpdate) {
            await this.syncController.syncFile(file);
          }
        }
      })
    );

    this.plugin.registerMarkdownPostProcessor(async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      // console.log(`MarkdownPostProcessor "${ctx.sourcePath}"`);
      await this.markdownPostProcessorMutex.runExclusive(async () => {
        const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
        if (file instanceof TFile) {
          const isUpdate = await this.fileStateHolder.initIfNeeded(file);
          if (isUpdate) {
            await this.syncController.syncFile(file);
          }
        }
      });
    });

    this.plugin.registerEvent(
      this.app.workspace.on('quick-preview', async (file: TFile, data: string) => {
        const isUpdate = await this.fileStateHolder.initIfNeeded(file, data);
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
    await Promise.all(markdownLeaves.map(async (leaf) => await this.loadAndSyncActiveFile(leaf)));
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