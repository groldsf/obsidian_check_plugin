import { TextComponent } from "obsidian";
import { ValidationError } from "../validation/types";
import { validateJsonStringArray } from "../validation/validators";
import { BaseSettingComponent } from "./BaseSettingComponent";

/**
 * Абстрактный базовый класс для компонентов настроек,
 * которые управляют массивом строк через текстовое поле с JSON.
 */
export abstract class BaseTextArraySettingComponent extends BaseSettingComponent {
  /** Ссылка на текстовое поле ввода */
  protected textInput: TextComponent;

  constructor() {
    super();
  }

  /**
   * Форматирует массив строк в JSON строку для отображения в UI.
   * @param symbols Массив строк.
   * @returns Форматированная JSON строка.
   */
  protected arrayToJsonString(symbols: string[] | undefined): string {
    if (!symbols) {
      return '[]';
    }
    try {
      return JSON.stringify(symbols);
    } catch (e) {
      console.error(`[${this.getSettingKey()}] Error stringifying array to JSON:`, e);
      return '[]'; // Возвращаем безопасное значение
    }
  }

  /**
   * Получает JSON строку из UI и парсит ее в массив строк.
   * @returns Распарсенный массив строк.
   * @throws Error если компонент не отрисован или если строка не является валидным JSON.
   */
  getValueFromUi(): string[] {
    if (this.textInput) {
      const rawJson = this.textInput.getValue();
      const trimmedValue = rawJson.trim();

      // Считаем пустую строку или '[]' валидным представлением пустого массива
      if (trimmedValue === '' || trimmedValue === '[]') {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmedValue);
        // Дополнительная проверка, что результат парсинга - массив
        if (!Array.isArray(parsed)) {
          // Эта ошибка также будет поймана validateJsonStringArray,
          // но для надежности можно оставить.
          throw new Error("Input must be a valid JSON array.");
        }
        // Предполагаем, что содержимое массива будет проверено валидатором.
        // Возвращаем как string[] для TypeScript.
        return parsed as string[];
      } catch (e: any) {
        // Оборачиваем ошибку парсинга
        throw new Error(`Invalid JSON format: ${e.message}`);
      }
    }
    // Если компонент не был отрисован
    throw new Error(`[${this.getSettingKey()}] Cannot get value from UI before component is rendered.`);
  }

  /**
   * Устанавливает значение (массив строк) в UI, предварительно форматируя его в JSON.
   * @param value Массив строк для установки.
   * @throws Error если компонент не отрисован.
   */
  setValueInUi(value: any): void {
    if (this.textInput) {
      // Убедимся, что на вход пришел массив, прежде чем его форматировать
      if (!Array.isArray(value)) {
        console.warn(`[${this.getSettingKey()}] Attempted to set non-array value in TextArray component. Value:`, value);
        // Можно установить пустой массив или выбросить ошибку?
        // Установим пустой массив для безопасности UI.
        this.textInput.setValue('[]');
        return;
      }
      const jsonStringValue = this.arrayToJsonString(value as string[]);
      this.textInput.setValue(jsonStringValue);
    } else {
      // Если компонент не был отрисован
      throw new Error(`[${this.getSettingKey()}] Cannot set value before component is rendered.`);
    }
  }

  /**
   * Выполняет базовую валидацию: проверяет, что строка в UI является
   * валидным JSON-массивом строк по одному символу без дубликатов.
   * Не проверяет на пустоту массива.
   * @returns Объект ValidationError при ошибке, иначе null.
   */
  validate(): ValidationError | null {
    let rawValue: string;
    try {
      if (this.textInput) {
        rawValue = this.textInput.getValue();
      } else {
        // Если UI нет, валидация невозможна
        throw new Error("UI component not available for validation.");
      }

      // Вызываем внешний валидатор для проверки формата JSON и содержимого
      const jsonError = validateJsonStringArray(rawValue);

      if (jsonError) {
        // Добавляем ключ поля к ошибке
        return {
          field: this.getSettingKey(),
          message: jsonError.message
        };
      }
    } catch (error: any) {
      // Ловим ошибки доступа к UI
      return {
        field: this.getSettingKey(),
        message: error instanceof Error ? error.message : String(error)
      };
    }

    // Базовая валидация JSON и содержимого прошла успешно
    return null;
  }
}