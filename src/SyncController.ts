import { Editor, TFile } from "obsidian";
import CheckboxSyncPlugin from "./main";
import { Mutex } from "async-mutex";

export default class SyncController {
    private plugin: CheckboxSyncPlugin;
    private mutex: Mutex;
    constructor(plugin: CheckboxSyncPlugin) {
        this.plugin = plugin;
        this.mutex = new Mutex();
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
            let text = await this.plugin.app.vault.read(file);
            let newText = this.plugin.checkboxUtils.syncCheckboxes(text);
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