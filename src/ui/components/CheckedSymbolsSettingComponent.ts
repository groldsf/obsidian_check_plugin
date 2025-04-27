import { Setting } from "obsidian";
import { CheckboxSyncPluginSettings } from "src/types";
import { ValidationError } from "../validation/types";
import { validateNotEmptyArray } from "../validation/validators";
import { BaseTextArraySettingComponent } from "./BaseTextArraySettingComponent";

// ИЗМЕНЕНИЕ: Наследуемся от BaseTextArraySettingComponent
export class CheckedSymbolsSettingComponent extends BaseTextArraySettingComponent {

  constructor() {
    super(); // Вызываем конструктор родителя
  }

  // --- Реализация специфичных для этого компонента методов ---

  getSettingKey(): keyof CheckboxSyncPluginSettings {
    return 'checkedSymbols';
  }


  render(container: HTMLElement, currentValue: any): void {
    // Используем унаследованный arrayToJsonString
    const jsonStringValue = this.arrayToJsonString(currentValue as string[]);

    this.setting = new Setting(container)
      // Уникальные тексты для этого компонента
      .setName("Checked Symbols")
      .setDesc("Enter symbols as a JSON array of single-character strings. Example: [\"x\", \"✓\", \" \"]")
      .addText(text => {
        // Используем унаследованное поле textInput
        this.textInput = text;
        text
          .setPlaceholder("e.g., [\"x\", \" \"]") // Уникальный плейсхолдер?
          .setValue(jsonStringValue)
          // Используем унаследованный onChangeCallback
          .onChange(this.onChangeCallback);
      });
  }

  // --- Переопределение validate для добавления проверки на пустоту ---
  validate(): ValidationError | null {
    // 1. Выполняем базовую валидацию JSON из родительского класса
    const baseError = super.validate(); // Вызов BaseTextArraySettingComponent.validate()
    if (baseError) {
      // Если базовый JSON невалиден, сразу возвращаем ошибку
      return baseError;
    }

    // 2. Если базовый JSON валиден, получаем распарсенное значение
    let parsedValue: string[];
    try {
      // Вызов getValueFromUi из BaseTextArraySettingComponent
      // Теперь это безопасно, так как super.validate() гарантирует валидный JSON
      parsedValue = this.getValueFromUi();
    } catch (error: any) {
      // На всякий случай ловим ошибку, хотя не должны сюда попасть после super.validate()
      return {
        field: this.getSettingKey(),
        message: error instanceof Error ? error.message : String(error)
      };
    }

    // 3. Выполняем дополнительную проверку на непустой массив
    const notEmptyError = validateNotEmptyArray(parsedValue);
    if (notEmptyError) {
      // Возвращаем ошибку "непустого массива", добавляя ключ поля
      return {
        field: this.getSettingKey(),
        message: notEmptyError.message
      };
    }

    // Все проверки (базовая + специфичная) пройдены
    return null;
  }
}