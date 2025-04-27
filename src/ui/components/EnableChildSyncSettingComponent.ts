import { ToggleComponent, Setting } from "obsidian";
import { CheckboxSyncPluginSettings } from "src/types";
import { ValidationError } from "../validation/types";
import { validateValueIsBoolean } from "../validation/validators";
import { BaseSettingComponent } from "./BaseSettingComponent";


export class EnableChildSyncSettingComponent extends BaseSettingComponent {
  private toggleComponent: ToggleComponent;

  constructor() {
    super();
  }

  getSettingKey(): keyof CheckboxSyncPluginSettings {
    return 'enableAutomaticChildState';
  }

  render(container: HTMLElement, currentValue: any): void {
    this.setting = new Setting(container)
      .setName('Update child checkbox state automatically')
      .setDesc('If enabled, changing the state of a parent checkbox will automatically update the state of all its direct and nested children. If disabled, changing a parent checkbox will not affect its children.')
      .addToggle(toggle => {
        this.toggleComponent = toggle;
        toggle
          .setValue(currentValue as boolean)
          .onChange(this.onChangeCallback);
      });
  }

  getValueFromUi(): boolean {
    if (this.toggleComponent) {
      return this.toggleComponent.getValue();
    }
    throw new Error(`[${this.getSettingKey()}] Cannot get value from UI before component is rendered.`);
  }

  setValueInUi(value: any): void {
    if (this.toggleComponent) {
      this.toggleComponent.setValue(value as boolean);
    } else {
      throw new Error(`[${this.getSettingKey()}] Cannot set value before component is rendered.`);
    }
  }

  validate(): ValidationError | null {
    const valueFromUi = this.getValueFromUi();
    const validationResult = validateValueIsBoolean(valueFromUi);

    if (validationResult) {
      return {
        field: this.getSettingKey(),
        message: validationResult.message
      };
    }
    return null;
  }
}