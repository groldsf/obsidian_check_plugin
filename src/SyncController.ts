import { Editor, EditorChange, MarkdownFileInfo, MarkdownView, TFile } from "obsidian";
import CheckboxSyncPlugin from "./main";
import { Mutex } from "async-mutex";
import MultiMap from "./utils/MultiMap";
import clickEvent from "./events/ClickEvent";

export default class SyncController {
  private plugin: CheckboxSyncPlugin;
  private mutex: Mutex;

  private clickEvents: MultiMap<string, clickEvent>;
  constructor(plugin: CheckboxSyncPlugin) {
    this.plugin = plugin;
    this.mutex = new Mutex();
    this.clickEvents = new MultiMap();
  }

  addClickEvent(event: clickEvent) {
    this.clickEvents.add(event.filePath, event);
  }

  async syncEditor(editor: Editor, info: MarkdownView | MarkdownFileInfo) {
    await this.mutex.runExclusive(() => {
      console.log(`syncEditor start`);

      const text = editor.getValue();
      if (!info.file) {
        console.log(`file not found`);
        return;
      }
      //проверка, что чекбоксы не синхронизированны
      const testText = this.plugin.checkboxUtils.syncCheckboxes(text);
      if (testText === text) {
        console.log(`syncEditor stop, text == testText`);
        this.plugin.fileStateHolder.set(info.file, text);
        return;
      }
      const textBefore = this.plugin.fileStateHolder.get(info.file);
      let newText = text;

      if (textBefore && textBefore!== text) {
        const diffs = this.findDifferentLineIndexes(text, textBefore);
        for (const diffLineIndex of diffs.reverse()) {
          newText = this.plugin.checkboxUtils.syncCheckboxesAfterDifferentLine(newText, diffLineIndex);
        }
        console.log(`stop diff lines`);
      }

      newText = this.plugin.checkboxUtils.syncCheckboxes(newText);
      if (newText === text) {
        this.plugin.fileStateHolder.set(info.file, newText);
        console.log(`syncEditor stop, text == newText`);
        return;
      }

      const cursor = editor.getCursor();
      const newDiffs = this.findDifferentLineIndexes(text, newText);
      const lastDifferentLineIndex = newDiffs.length > 0 ? newDiffs[0] : -1;

      const newLines = newText.split("\n");
      const oldLines = text.split("\n");
      if (newLines.length !== oldLines.length) {
        throw new Error();
      }
      const changes: EditorChange[] = [];
      for (let i = 0; i < oldLines.length; i++) {
        if (newLines[i] !== oldLines[i]) {
          // editor.setLine(i, newLines[i]);
          changes.push({
            from: { line: i, ch: 0 },
            to: { line: i, ch: oldLines[i].length },
            text: newLines[i]
          });
        }
      }
      editor.transaction({
        changes: changes
      });

      editor.setCursor(cursor);
      if (lastDifferentLineIndex != -1) {
        editor.scrollIntoView({
          from: { line: lastDifferentLineIndex, ch: 0 },
          to: { line: lastDifferentLineIndex, ch: 0 }
        });
      }
      this.plugin.fileStateHolder.set(info.file, newText);
      console.log(`syncEditor stop`);
    });
  }

  async syncFile(file: TFile | null) {
    if (!(file instanceof TFile) || file.extension !== "md") {
      return;
    }
    await this.mutex.runExclusive(async () => {
      console.log(`sync file ${file.basename} date: ${Date.now()}`)
      let text = await this.plugin.app.vault.read(file);
      let textBefore = this.plugin.fileStateHolder.get(file);
      let newText = text;
      if (textBefore) {
        const diffs = this.findDifferentLineIndexes(textBefore, text);
        for (const diffLineIndex of diffs.reverse()) {
          newText = this.plugin.checkboxUtils.syncCheckboxesAfterDifferentLine(newText, diffLineIndex);
        }
      }

      newText = this.plugin.checkboxUtils.syncCheckboxes(newText);
      if (newText === text) {
        return;
      }
      await this.plugin.fileStateHolder.set(file, newText);
      await this.plugin.app.vault.modify(file, newText);
    });
  }

  private findDifferentLineIndexes(text1: string, text2: string): number[] {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const minLength = Math.min(lines1.length, lines2.length);

    const result: number[] = [];

    for (let i = 0; i < minLength; i++) {
      if (lines1[i] !== lines2[i]) {
        result.push(i);
      }
    }

    if (lines1.length !== lines2.length) {
      for (let i = Math.min(lines1.length, lines2.length) + 1; i < Math.max(lines1.length, lines2.length); i++) {
        result.push(i);
      }
    }

    return result;
  }

  flushChangeIfNeeded(editor: Editor, info: MarkdownView | MarkdownFileInfo) {
    if (info instanceof MarkdownView) {
      console.log(`MarkdownView ${info.file?.path} flush`);
      info.save();
    }
  }
}