import { CheckboxSyncPluginSettings } from './types';
import ignore, { Ignore } from 'ignore';

export class FileFilter {
  private settings: Readonly<CheckboxSyncPluginSettings>;
  private ignorer: Ignore | null = null;

  constructor(settings: Readonly<CheckboxSyncPluginSettings>) {
    this.settings = settings;
    this.initIgnorer();
  }

  private initIgnorer(): void {
    const globs = this.settings.pathGlobs;
    if (globs && globs.length > 0) {
      this.ignorer = ignore();
      // Добавляем только непустые строки и не комментарии
      const validGlobs = globs.filter(g => g && g.trim() !== '' && !g.trim().startsWith('#'));
      if (validGlobs.length > 0) {
        this.ignorer.add(validGlobs);
      } else {
        // Если все глобы были пустыми или комментариями
        this.ignorer = null; 
      }
    } else {
      this.ignorer = null;
    }
  }

  /**
   * Checks if a given file path is allowed based on the pathGlobs setting
   * using .gitignore-like logic provided by the 'ignore' library.
   * @param filePath The file path to check (relative to the vault root).
   * @returns True if the file is allowed for processing (i.e., NOT ignored), false otherwise.
   */
  public isPathAllowed(filePath: string): boolean {
    if (!this.ignorer) {
      return true; // Если нет правил (или все были комментариями), все разрешено
    }
    // Метод ignorer.ignores(filePath) вернет true, если файл должен быть ИГНОРИРОВАН.
    // Нам нужно инвертировать это, чтобы получить "разрешен ли файл".
    return !this.ignorer.ignores(filePath);
  }

	/**
   * Updates the filter المستقيمs with new plugin settings and re-initializes the ignorer.
   * @param newSettings The new plugin settings.
   */
  public updateSettings(newSettings: Readonly<CheckboxSyncPluginSettings>): void {
    console.log("FileFilter: Settings updated."); // Для отладки
    this.settings = newSettings; // Обновляем ссылку на настройки
    this.initIgnorer();          // Переинициализируем ignorer с новыми pathGlobs
  }
}
