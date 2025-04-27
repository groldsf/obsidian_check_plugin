import { Setting } from "obsidian";
import { CheckboxSyncPluginSettings } from "src/types";
import { BaseTextArraySettingComponent } from "src/ui/basedClasses/BaseTextArraySettingComponent";

export class IgnoreSymbolsSettingComponent extends BaseTextArraySettingComponent {

    constructor() {
        super();
    }

    // --- Реализация специфичных методов ---

    getSettingKey(): keyof CheckboxSyncPluginSettings {
        return 'ignoreSymbols';
    }

    render(container: HTMLElement, currentValue: any): void {
        const jsonStringValue = this.arrayToJsonString(currentValue as string[]);

        this.setting = new Setting(container)
            .setName("Ignore Symbols")
            .setDesc("Checkboxes with these symbols will be ignored during automatic parent/child state updates. Example: [\"-\", \"~\"]")
            .addText(text => {
                this.textInput = text;
                text
                    .setPlaceholder("e.g., [\"-\", \"~\"]")
                    .setValue(jsonStringValue)
                    .onChange(this.onChangeCallback);
            });
    }

    // validate() НЕ переопределяем. Используется базовая реализация
    // из BaseTextArraySettingComponent, которая вызывает только
    // validateJsonStringArray (проверка формата JSON и содержимого).
    // Пустой массив здесь допустим.

    // getValueFromUi, setValueInUi, arrayToJsonString унаследованы
}