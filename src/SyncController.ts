import { Mutex } from "async-mutex";
import { Editor, EditorChange, MarkdownFileInfo, MarkdownView, TFile } from "obsidian";
import CheckboxSyncPlugin from "./main";
import { CheckboxUtils } from "./checkboxUtils";
import FileStateHolder from "./FileStateHolder";

export default class SyncController {
  private plugin: CheckboxSyncPlugin;//delete
  private checkboxUtils: CheckboxUtils;
  private fileStateHolder: FileStateHolder;

  private mutex: Mutex;

  constructor(plugin: CheckboxSyncPlugin, checkboxUtils: CheckboxUtils, fileStateHolder: FileStateHolder) {
    this.plugin = plugin;//delete
    this.checkboxUtils = checkboxUtils;
    this.fileStateHolder = fileStateHolder;
    this.mutex = new Mutex();
  }

  async syncEditor(editor: Editor, info: MarkdownView | MarkdownFileInfo) {
    if (!info.file) {
      return;
    }
    await this.mutex.runExclusive(() => {
      const file = info.file!;
      console.log(`sync editor "${file.basename}" start.`);
      const text = editor.getValue();
      const textBefore = this.fileStateHolder.get(file);

      let newText = this.syncText(text, textBefore);
      if (newText === text) {
        console.log(`sync editor "${file.basename}" stop. new text equals old text.`);
        return;
      }

      this.editEditor(editor, text, newText);
      this.fileStateHolder.set(file, newText);
      
      console.log(`syncEditor "${file.basename}" stop.`);
    });
  }

  async syncFile(file: TFile | null) {
    if (!(file instanceof TFile) || file.extension !== "md") {
      return;
    }
    await this.mutex.runExclusive(async () => {
      console.log(`sync file "${file.basename}" start.`);
      let text = await this.plugin.app.vault.read(file);
      let textBefore = this.fileStateHolder.get(file);

      let newText = this.syncText(text, textBefore);

      if (newText === text) {
        console.log(`sync file "${file.basename}" stop. new text equals old text.`);
        return;
      }
      this.fileStateHolder.set(file, newText);
      await this.plugin.app.vault.modify(file, newText);
      console.log(`sync file "${file.basename}" stop.`);
    });
  }

  syncText(text: string, textBefore: string | undefined): string {
    let newText;
    newText = this.syncTextBefore(text, textBefore);
    newText = this.checkboxUtils.syncCheckboxes(newText);
    return newText;
  }

  syncTextBefore(text: string, textBefore: string | undefined): string {
    if (!textBefore) return text;
    const beforeLines = textBefore.split('\n');
    const textLines = text.split('\n');

    if (beforeLines.length !== textLines.length) return text;

    const diffs = this.findDifferentLineIndexes(beforeLines, textLines);
    if (diffs.length !== 1) {
      return text;
    }
    return this.checkboxUtils.syncCheckboxesAfterDifferentLine(text, diffs[0]);
  }

  findDifferentLineIndexes(lines1: string[], lines2: string[]): number[] {
    if (lines1.length !== lines2.length) {
      throw new Error("the length of the lines must be equal");
    }

    const length = lines1.length;
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      if (lines1[i] !== lines2[i]) {
        result.push(i);
      }
    }
    return result;
  }

  editEditor(editor: Editor, oldText: string, newText: string){
    const cursor = editor.getCursor();

      const newLines = newText.split("\n");
      const oldLines = oldText.split("\n");

      const diffIndexes = this.findDifferentLineIndexes(oldLines, newLines);     

      const changes: EditorChange[] = [];

      for (let ind of diffIndexes) {
        changes.push({
          from: { line: ind, ch: 0 },
          to: { line: ind, ch: oldLines[ind].length },
          text: newLines[ind]
        });
      }
      editor.transaction({
        changes: changes
      });

      editor.setCursor(cursor);

      const lastDifferentLineIndex = diffIndexes.length > 0 ? diffIndexes[0] : -1;
      if (lastDifferentLineIndex != -1) {
        editor.scrollIntoView({
          from: { line: lastDifferentLineIndex, ch: 0 },
          to: { line: lastDifferentLineIndex, ch: 0 }
        });
      }
  }

}