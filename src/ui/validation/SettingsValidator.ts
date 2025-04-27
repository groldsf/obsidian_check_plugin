// src/settings/validation/SettingsValidator.ts

import { CheckboxSyncPluginSettings } from '../../types'; // Путь к типам
import { ValidationError } from './types'; // Путь к типам ошибок

/**
 * Отвечает за валидацию настроек, требующую проверки нескольких полей (перекрестная валидация).
 * **Важно:** Логика внутри методов не должна зависеть от Obsidian API для тестируемости.
 */
export class SettingsValidator {

  /**
   * Выполняет перекрестную валидацию предоставленных данных настроек.
   * @param settingsData - Объект с текущими значениями настроек (или их частью).
   * @returns Массив объектов ValidationError, если найдены ошибки, иначе пустой массив.
   */
  public validate(settingsData: Partial<CheckboxSyncPluginSettings>): ValidationError[] {
    const errors: ValidationError[] = [];

    const checked = settingsData.checkedSymbols ?? [];
    const unchecked = settingsData.uncheckedSymbols ?? [];
    const ignore = settingsData.ignoreSymbols ?? [];

    // --- Проверка пересечений ---

    // Пересечение Checked и Unchecked
    const intersection1 = this.findIntersection(checked, unchecked);
    if (intersection1.length > 0) {
      errors.push({
        message: `Symbols found in both Checked and Unchecked lists: ${this.formatSymbolsForError(intersection1)}`
      });
    }

    // Пересечение Checked и Ignore
    const intersection2 = this.findIntersection(checked, ignore);
    if (intersection2.length > 0) {
      errors.push({
        message: `Symbols found in both Checked and Ignore lists: ${this.formatSymbolsForError(intersection2)}`
      });
    }

    // Пересечение Unchecked и Ignore
    const intersection3 = this.findIntersection(unchecked, ignore);
    if (intersection3.length > 0) {
      errors.push({
        message: `Symbols found in both Unchecked and Ignore lists: ${this.formatSymbolsForError(intersection3)}`
      });
    }

    return errors;
  }

  /**
     * Находит пересечение двух массивов строк.
     * @param listA Первый массив.
     * @param listB Второй массив.
     * @returns Массив строк, присутствующих в обоих списках.
     */
  private findIntersection(listA: string[], listB: string[]): string[] {
    if (!listA || !listB) return []; // Защита от null/undefined
    const setB = new Set(listB);
    return listA.filter(symbol => setB.has(symbol));
  }

  /**
   * Форматирует массив символов для вывода в сообщении об ошибке (как JSON).
   * @param symbols Массив символов.
   * @returns Строка JSON.
   */
  private formatSymbolsForError(symbols: string[]): string {
    try {
      return JSON.stringify(symbols);
    } catch (e) {
      // На случай очень странных ошибок
      return symbols.join(', ');
    }
  }
}