// src/settings/components/EnableFileSyncSettingComponent.ts
import { Setting, ToggleComponent } from 'obsidian';
import { CheckboxSyncPluginSettings } from '../../types';
import { BaseSettingComponent } from './BaseSettingComponent';
import { ValidationError } from '../validation/types';
import { validateValueIsBoolean } from '../validation/validators'; // Используем тот же валидатор

export class EnableFileSyncSettingComponent extends BaseSettingComponent {
  private toggleComponent: ToggleComponent;

  constructor() {
    super();
  }

  getSettingKey(): keyof CheckboxSyncPluginSettings {
    // ИЗМЕНЕНИЕ: Другой ключ
    return 'enableAutomaticFileSync';
  }

  render(container: HTMLElement, currentValue: any): void {
    this.setting = new Setting(container)
      // ИЗМЕНЕНИЕ: Другие тексты
      .setName("Enable automatic file synchronization")
      .setDesc("If enabled (requires restart or settings reload), automatically syncs checkbox states when files are loaded/opened and after settings changes. If disabled (default), sync only occurs when you manually change a checkbox.")
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
    // Выбрасываем ошибку, если компонент не отрисован
    throw new Error(`[${this.getSettingKey()}] Cannot get value from UI before component is rendered.`);
  }

  setValueInUi(value: any): void {
    if (this.toggleComponent) {
      this.toggleComponent.setValue(value as boolean);
    } else {
      // Выбрасываем ошибку, если компонент не отрисован
      throw new Error(`[${this.getSettingKey()}] Cannot set value before component is rendered.`);
    }
  }

  validate(): ValidationError | null {
    let valueFromUi: boolean;
    try {
      valueFromUi = this.getValueFromUi(); // Получаем значение
    } catch (error) {
      // Если getValueFromUi выбросил ошибку (маловероятно до рендера)
      return {
        field: this.getSettingKey(),
        message: error instanceof Error ? error.message : String(error)
      };
    }

    const validationResult = validateValueIsBoolean(valueFromUi); // Используем внешний валидатор

    if (validationResult) {
      return {
        field: this.getSettingKey(),
        message: validationResult.message
      };
    }
    return null;
  }
}