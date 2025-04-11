import { Mutex } from "async-mutex";
import { Editor, EditorChange, MarkdownFileInfo, MarkdownView, TFile, Vault } from "obsidian";
import { CheckboxUtils } from "./checkboxUtils";
import FileStateHolder from "./FileStateHolder";

export default class SyncController {
  // private plugin: CheckboxSyncPlugin;//delete
  private vault: Vault;
  private checkboxUtils: CheckboxUtils;
  private fileStateHolder: FileStateHolder;

  private mutex: Mutex;

  constructor(vault: Vault, checkboxUtils: CheckboxUtils, fileStateHolder: FileStateHolder) {
    // this.plugin = plugin;//delete
    this.vault = vault;
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

      let newText = this.checkboxUtils.syncText(text, textBefore);
      if (newText === text) {
        console.log(`sync editor "${file.basename}" stop. new text equals old text.`);
        return;
      }

      this.fileStateHolder.set(file, newText);
      this.editEditor(editor, text, newText);

      console.log(`syncEditor "${file.basename}" stop.`);
    });
  }

  async syncFile(file: TFile | null) {
    if (!(file instanceof TFile) || file.extension !== "md") {
      return;
    }
    await this.mutex.runExclusive(async () => {
      console.log(`sync file "${file.basename}" start.`);
      const newText = await this.vault.process(file, (text) => {
        let textBefore = this.fileStateHolder.get(file);
        let newText = this.checkboxUtils.syncText(text, textBefore);
        return newText;
      });
      this.fileStateHolder.set(file, newText);
      console.log(`sync file "${file.basename}" stop.`);
    });
  }

  private editEditor(editor: Editor, oldText: string, newText: string) {
    const cursor = editor.getCursor();

    const newLines = newText.split("\n");
    const oldLines = oldText.split("\n");

    const diffIndexes = this.checkboxUtils.findDifferentLineIndexes(oldLines, newLines);

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