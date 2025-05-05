import { DropdownComponent, Setting } from "obsidian";
import { CheckboxSyncPluginSettings, CheckboxState } from "src/types";
import { BaseSettingComponent } from "src/ui/basedClasses/BaseSettingComponent";
import { ValidationError } from "src/ui/validation/types";
import { validateIsCheckboxState } from "src/ui/validation/validators";


export class UnknownPolicySettingComponent extends BaseSettingComponent {
  private dropdownComponent: DropdownComponent;

  constructor() {
    super();
  }

  getSettingKey(): keyof CheckboxSyncPluginSettings {
    return 'unknownSymbolPolicy';
  }

  render(container: HTMLElement, currentValue: any): void {
    this.setting = new Setting(container)
      .setName('Unknown Symbol Policy')
      .setDesc('How to treat symbols not in Checked, Unchecked or Ignore lists.')
      .addDropdown(dropdown => {
        this.dropdownComponent = dropdown;
        dropdown
          .addOption(CheckboxState.Checked, 'Treat as Checked')
          .addOption(CheckboxState.Unchecked, 'Treat as Unchecked')
          .addOption(CheckboxState.Ignore, 'Ignore')
          .setValue(currentValue as string) // Dropdown работает со строками
          .onChange(this.onChangeCallback);
      });
  }

  getValueFromUi(): CheckboxState {
    if (this.dropdownComponent) {
      // Значение из dropdown - строка, кастуем к CheckboxState
      return this.dropdownComponent.getValue() as CheckboxState;
    }
    throw new Error(`[${this.getSettingKey()}] Cannot get value from UI before component is rendered.`);
  }

  setValueInUi(value: any): void {
    if (this.dropdownComponent) {
      this.dropdownComponent.setValue(value as string);
    } else {
      throw new Error(`[${this.getSettingKey()}] Cannot set value before component is rendered.`);
    }
  }

  validate(): ValidationError | null {
    let valueFromUi: CheckboxState;
    try {
      valueFromUi = this.getValueFromUi();
    } catch (error) {
      return {
        field: this.getSettingKey(),
        message: error instanceof Error ? error.message : String(error)
      };
    }

    // Вызываем внешний валидатор
    const validationResult = validateIsCheckboxState(valueFromUi);

    if (validationResult) {
      return {
        field: this.getSettingKey(),
        message: validationResult.message
      };
    }
    return null;
  }
}