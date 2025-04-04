import { TFile } from "obsidian";
import CheckboxSyncPlugin from "./main";
import { Mutex } from "async-mutex";


export default class FileStateHolder {
  private map: Map<TFile, string>;
  private plugin: CheckboxSyncPlugin;
  private mutex: Mutex;

  constructor(plugin: CheckboxSyncPlugin) {
    this.map = new Map();
    this.plugin = plugin;
    this.mutex = new Mutex();
  }

  async update(file: TFile) {
    await this.mutex.runExclusive(async () => {
      const text = await this.plugin.app.vault.read(file);
      this.set(file, text);
    });
  }
  async updateIfNeeded(file: TFile) {
    await this.mutex.runExclusive(async () => {
      if (!this.map.has(file)) {
        const text = await this.plugin.app.vault.read(file);
        this.set(file, text);
      }
    });
  }

  has(file: TFile){
    return this.map.has(file);
  }

  set(file: TFile, text: string) {
    console.log(`File "${file.name}" load to holder`);
    this.map.set(file, text);
  }

  get(file: TFile) {
    return this.map.get(file);
  }
}