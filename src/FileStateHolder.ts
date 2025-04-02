import { TFile } from "obsidian";
import CheckboxSyncPlugin from "./main";


export default class FileStateHolder {
    private map: Map<TFile, string>;
    private plugin: CheckboxSyncPlugin;

    constructor(plugin: CheckboxSyncPlugin) {
        this.map = new Map();
        this.plugin = plugin;
    }

    async init() {
        const vault = this.plugin.app.vault;
        const files = vault.getMarkdownFiles();
        // Создаём массив промисов для чтения всех файлов
        const readPromises = files.map(async (file) => {
            const content = await vault.read(file);
            this.add(file, content);
        });
        // Ждём завершения всех операций чтения
        await Promise.all(readPromises);
    }

    async update(file: TFile) {
        const vault = this.plugin.app.vault;
        const text = await vault.read(file);
        this.map.set(file, text);
    }

    add(file: TFile, text: string) {
        this.map.set(file, text);
    }

    get(file: TFile) {
        return this.map.get(file);
    }
}