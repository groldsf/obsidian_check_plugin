import { Editor, TFile } from "obsidian";
import CheckboxSyncPlugin from "./main";

export default class CheckboxManager {
    private plugin: CheckboxSyncPlugin;
    private isProcessingFile = false;
    constructor(plugin: CheckboxSyncPlugin) {
        this.plugin = plugin;
    }

    async syncEditor(editor: Editor) {
        await this.syncEditorCheckboxes(editor);
    }

    async syncFile(file: any) {
        if (this.isProcessingFile || !(file instanceof TFile) || file.extension !== "md") return;
        this.isProcessingFile = true;
        try {
            await this.syncFileCheckboxes(file);
        } finally {
            this.isProcessingFile = false;
        }
    }

    private async syncEditorCheckboxes(editor: Editor) {
        const updates = this.plugin.checkboxUtils.syncCheckboxes(editor.getValue());
        if (updates.length === 0) return;

        const firstUpdateLine = updates[0].line;
        editor.setCursor({ line: firstUpdateLine, ch: editor.getLine(firstUpdateLine).length });
        editor.blur();

        updates.forEach(({ line, ch, value }) => {
            editor.replaceRange(value, { line, ch }, { line, ch: ch + 1 });
        });
    }

    private async syncFileCheckboxes(file: TFile) {
        let text = await this.plugin.app.vault.read(file);
        let updates = this.plugin.checkboxUtils.syncCheckboxes(text);
        if (updates.length === 0) return;

        while (true) {
            const lines = text.split("\n");
            updates.forEach(({ line, ch, value }) => {
                lines[line] = lines[line].substring(0, ch) + value + lines[line].substring(ch + 1);
            });
            text = lines.join("\n");
            updates = this.plugin.checkboxUtils.syncCheckboxes(text);
            if (updates.length === 0) break;
        }
        await this.plugin.app.vault.modify(file, text);
    }
}