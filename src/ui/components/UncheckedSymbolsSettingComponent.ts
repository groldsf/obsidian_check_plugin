import { Setting } from "obsidian";
import { CheckboxSyncPluginSettings } from "src/types";
import { ValidationError } from "../validation/types";
import { validateNotEmptyArray } from "../validation/validators";
import { BaseTextArraySettingComponent } from "./BaseTextArraySettingComponent";


export class UncheckedSymbolsSettingComponent extends BaseTextArraySettingComponent {

    constructor() {
        super();
    }

    // --- Реализация специфичных методов ---

    getSettingKey(): keyof CheckboxSyncPluginSettings {
        return 'uncheckedSymbols';
    }

    render(container: HTMLElement, currentValue: any): void {
        const jsonStringValue = this.arrayToJsonString(currentValue as string[]);

        this.setting = new Setting(container)
            .setName("Unchecked Symbols")
            .setDesc("Enter symbols as a JSON array of single-character strings. Example: [\" \", \"?\", \",\"]")
            .addText(text => {
                this.textInput = text;
                text
                    .setPlaceholder("e.g., [\" \", \"?\", \",\"]")
                    .setValue(jsonStringValue)
                    .onChange(this.onChangeCallback);
            });
    }

    // Переопределяем validate, чтобы добавить проверку на пустоту
    validate(): ValidationError | null {
        // 1. Базовая валидация JSON из родителя
        const baseError = super.validate();
        if (baseError) {
            return baseError;
        }

        // 2. Получаем значение (теперь безопасно)
        let parsedValue: string[];
        try {
            parsedValue = this.getValueFromUi();
        } catch (error: any) {
            return { field: this.getSettingKey(), message: error.message };
        }

        // 3. Дополнительная проверка на непустой массив
        const notEmptyError = validateNotEmptyArray(parsedValue);
        if (notEmptyError) {
            return {
                field: this.getSettingKey(),
                message: notEmptyError.message
            };
        }

        return null; // Все проверки пройдены
    }

    // getValueFromUi, setValueInUi, arrayToJsonString унаследованы
}