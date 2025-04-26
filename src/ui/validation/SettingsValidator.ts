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

    // Пример: Проверка пересечения списков символов (будет реализована позже)
    // if (settingsData.checkedSymbols && settingsData.uncheckedSymbols) {
    //     const intersection = settingsData.checkedSymbols.filter(symbol => settingsData.uncheckedSymbols!.includes(symbol));
    //     if (intersection.length > 0) {
    //         errors.push({
    //             // Можно не указывать поле, т.к. ошибка затрагивает несколько
    //             message: `Symbols found in both Checked and Unchecked lists: ${JSON.stringify(intersection)}`
    //         });
    //     }
    // }
    // ... другие перекрестные проверки ...

    // Пока возвращаем пустой массив, логика будет добавлена на Шаге 6
    return errors;
  }

  // Сюда можно добавить статические вспомогательные методы для валидации, если нужно
  // public static validateSymbolListsIntersection(listA: string[], listB: string[]): string[] {
  //     return listA.filter(symbol => listB.includes(symbol));
  // }
}