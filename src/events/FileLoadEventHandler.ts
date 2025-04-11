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
    await Promise.all(markdownLeaves.map(async (leaf) => await this.initializeStateForLeaf(leaf)));
  }

  private async initializeStateForLeaf(leaf: WorkspaceLeaf) {
    const view = leaf.view as MarkdownView;
    if (!view.file) return;

    const file = view.file;
    console.log(`Initializing state for active file and its embeds: ${file.path}`);

    const filesToInitialize: Set<TFile> = new Set([file]);
    await this.findEmbedsRecursive(file, filesToInitialize);

    for (const fileToInit of filesToInitialize) {
        try {
            const isUpdateNeeded = await this.fileStateHolder.initIfNeeded(fileToInit);
            // Синхронизируем только если инициализация это потребовала,
            // ИЛИ если это основной файл, открытый в редакторе (на всякий случай)
            if (isUpdateNeeded || (fileToInit === file && view.getMode() === 'source')) {
                 // Если основной файл в редакторе, лучше вызвать syncEditor для него
                 if (fileToInit === file && view.getMode() === 'source') {
                    await this.syncController.syncEditor(view.editor, view);
                 } else {
                    await this.syncController.syncFile(fileToInit);
                 }
            }
        } catch (error) {
            console.error(`Error processing file ${fileToInit.path} during initial load:`, error);
        }
    }
  }

  // Вспомогательная рекурсивная функция для поиска всех вложенных embeds
  private async findEmbedsRecursive(file: TFile, visited: Set<TFile>) {
    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache?.embeds) return;

    for (const embed of cache.embeds) {
        const embedFile = this.app.metadataCache.getFirstLinkpathDest(embed.link, file.path);
        if (!embedFile) continue;

        if (embedFile instanceof TFile && embedFile.extension === 'md') {
            // Если файл еще не посещали, добавляем и ищем его внедрения
            if (!visited.has(embedFile)) {
                visited.add(embedFile);
                await this.findEmbedsRecursive(embedFile, visited);
            }
        }
    }
}
}