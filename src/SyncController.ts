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
      console.log(`syncEditor start`);
      const text = editor.getValue()
      const testText = this.plugin.checkboxUtils.syncCheckboxes(text);
      if (testText === text) { 
        console.log(`syncEditor stop, text == testText`);
        return; 
      }
      let newText = text;
      editor.undo();
      const textBefore = editor.getValue();
      editor.redo();
      const diffs = this.findDifferentLineIndexes(text, textBefore);
      for(const diffLineIndex of diffs.reverse()){
        console.log(`diff line index ${diffLineIndex}`);
        newText = this.plugin.checkboxUtils.syncCheckboxesAfterDifferentLine(newText, diffLineIndex);
      }
      console.log(`stop diff lines`, newText);

      newText = this.plugin.checkboxUtils.syncCheckboxes(newText);
      if (newText === text) { 
        console.log(`syncEditor stop, text == newText`);
        return; 
      }

      const cursor = editor.getCursor();
      const lastDifferentLineIndex = diffs.length > 0 ? diffs[0] : -1;

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
      if (lastDifferentLineIndex != -1) {
        editor.scrollIntoView({
          from: { line: lastDifferentLineIndex, ch: 0 },
          to: { line: lastDifferentLineIndex, ch: 0 }
        });
      }
      console.log(`syncEditor stop`, editor.getValue());
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
        for (const event of events!) {
          newText = this.plugin.checkboxUtils.syncCheckboxesAfterDifferentLine(newText, event.line);
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
}