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
            const newText = this.plugin.checkboxUtils.syncCheckboxes(editor.getValue());
            if (newText === editor.getValue()) return;

            let cursor = editor.getCursor();
            editor.setValue(newText);
            editor.setCursor(cursor);
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
}