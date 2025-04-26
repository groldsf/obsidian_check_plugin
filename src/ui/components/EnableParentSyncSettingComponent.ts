import { Setting, ToggleComponent } from 'obsidian';
import { CheckboxSyncPluginSettings } from '../../types';
import { BaseSettingComponent } from './BaseSettingComponent';
import { ValidationError } from '../validation/types';
import { validateValueIsBoolean } from '../validation/validators';

export class EnableParentSyncSettingComponent extends BaseSettingComponent {
  private toggleComponent: ToggleComponent;

  constructor() {
    super();
  }

  getSettingKey(): keyof CheckboxSyncPluginSettings {
    return 'enableAutomaticParentState'; // Ключ этой настройки
  }

  render(container: HTMLElement, currentValue: any): void {

    this.setting = new Setting(container)
      .setName('Update parent checkbox state automatically')
      .setDesc('If enabled, the state of a parent checkbox will be automatically updated based on the state of its children (all children checked = parent checked). If disabled, only manually changing a parent will affect its children.')
      .addToggle(toggle => {
        this.toggleComponent = toggle;
        // Используем as boolean, т.к. знаем тип для этой настройки
        toggle
          .setValue(currentValue as boolean)
          .onChange(this.onChangeCallback); // Просто передаем колбэк
      });
  }

  getValueFromUi(): boolean {
    if (this.toggleComponent) {
      return this.toggleComponent.getValue();
    }
    console.warn(`getValueFromUi called before render for ${this.getSettingKey()}`);
    // Используем унаследованный getDefaultValue() для консистентности
    return this.getDefaultValue();
  }

  setValueInUi(value: any): void {
    if (this.toggleComponent) {
      this.toggleComponent.setValue(value as boolean);
    }
  }

  validate(): ValidationError | null {
    let valueFromUi: boolean;
    try {
      valueFromUi = this.getValueFromUi();
    } catch (error) {
      console.error(`Error getting value from UI for ${this.getSettingKey()}:`, error);
      return {
        field: this.getSettingKey(),
        message: `Internal error getting value from UI: ${error instanceof Error ? error.message : String(error)}`
      };
    }

    // Вызываем внешнюю чистую функцию валидации
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