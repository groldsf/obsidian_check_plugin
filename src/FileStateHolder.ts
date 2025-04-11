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

  /**
   * Initializes the file's data if it hasn't been initialized yet.
   * 
   * @param file - The file object to initialize.
   * @param text - Optional text content to associate with the file. If not provided, it will be read from the vault.
   * @returns A promise that resolves to `true` if the file was initialized, or `false` if it was already initialized.
   */
  async initIfNeeded(file: TFile, text?: string): Promise<boolean> {
    if (this.has(file)) {
      return false;
    }
    let res = await this.mutex.runExclusive<boolean>(async () => {
      if (this.has(file)) {
        return false;
      }
      // console.log(`updateIfNeeded "${file.name}" start`);
      if (!text) {
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
    if (text !== this.map.get(file)) {
      console.log(`File "${file.name}" load to holder`);
      this.map.set(file, text);
    }
  }

  get(file: TFile) {
    return this.map.get(file);
  }

  getAllFiles(): TFile[] {
    const keysIterator = this.map.keys();
    const keysArray = Array.from(keysIterator);
    return keysArray;
  }
}