import { Mutex } from "async-mutex";
import { TFile, Vault } from "obsidian";


export default class FileStateHolder {
  private map: Map<TFile, string>;
  private vault: Vault;
  private mutex: Mutex;

  constructor(vault: Vault) {
    this.vault = vault;
    this.map = new Map();
    this.mutex = new Mutex();
  }

  async update(file: TFile) {
    await this.mutex.runExclusive(async () => {
      const text = await this.vault.read(file);
      this.set(file, text);
    });
  }

  // возвращает понадобилась ли загрузка
  async updateIfNeeded(file: TFile, text?: string): Promise<boolean> {
    if (this.has(file)) {
      return false;    
    }
    let res = await this.mutex.runExclusive<boolean>(async () => {
      if (this.has(file)) {
        return false;
      }
      console.log(`updateIfNeeded "${file.name}" start`);
      if (!text){
        text = await this.vault.read(file);
      } 
      this.set(file, text);     
      return true;
    });
    return res;
  }

  has(file: TFile) {
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