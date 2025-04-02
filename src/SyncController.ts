import { Editor, TFile } from "obsidian";
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

  async syncEditor(editor: Editor) {
    await this.mutex.runExclusive(() => {
      const text = editor.getValue()
      const newText = this.plugin.checkboxUtils.syncCheckboxes(text);
      if (newText === text) return;

      const cursor = editor.getCursor();

      editor.undo();
      const textBefore = editor.getValue();
      editor.redo();
      const lastDifferentLineIndex = this.findFirstDifferentLineIndex(text, textBefore);

      const newLines = newText.split("\n");
      const oldLines = text.split("\n");
      if (newLines.length !== oldLines.length) {
        throw new Error();
      }
      for (let i = 0; i < oldLines.length; i++) {
        if (newLines[i] !== oldLines[i]) {
          editor.setLine(i, newLines[i]);
          if (cursor.line == i) {
            editor.setCursor(cursor);
          }
        }
      }
      editor.scrollIntoView({
        from: { line: lastDifferentLineIndex, ch: 0 },
        to: { line: lastDifferentLineIndex, ch: 0 }
      });


      // editor.setValue(newText);

      // editor.setCursor(cursor);
    });
  }

  async syncFile(file: TFile | null) {
    if (!(file instanceof TFile) || file.extension !== "md") {
      return;
    }
    await this.mutex.runExclusive(async () => {
      console.log(`sync file ${Date.now()}`)
      let text = await this.plugin.app.vault.read(file);
      let newText = text;
      if (this.clickEvents.has(file.path)) {
        console.log(`contains events`);
        const events = this.clickEvents.get(file.path);
        this.clickEvents.delete(file.path);
        for (const event of events!){
          newText = this.plugin.checkboxUtils.syncCheckboxesAfterClick(newText, event.line);
          console.log(`Text after syncCheckboxesAfterClick`);
          console.log(newText);
        }
      }
      
      newText = this.plugin.checkboxUtils.syncCheckboxes(newText);
      if (newText === text) {
        return;
      }
      await this.plugin.app.vault.modify(file, newText);
    });
  }

  private findFirstDifferentLineIndex(text1: string, text2: string): number {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const minLength = Math.min(lines1.length, lines2.length);

    for (let i = 0; i < minLength; i++) {
      if (lines1[i] !== lines2[i]) {
        return i;
      }
    }

    // Если все строки до minLength совпадают, проверяем на разницу в длине
    if (lines1.length !== lines2.length) {
      return minLength;
    }

    // Если все строки совпадают
    return -1;
  }
}