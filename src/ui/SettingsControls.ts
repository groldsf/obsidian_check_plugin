import { ButtonComponent, Setting } from 'obsidian';

/**
 * Интерфейс для действий, которые должны выполнять кнопки управления.
 */
export interface ISettingsControlActions {
  onApply: () => Promise<void> | void;
  onReset: () => Promise<void> | void;
  onResetDefaults: () => Promise<void> | void;
}

/**
 * Параметры для обновления состояния кнопки Apply.
 */
export interface ApplyButtonStateOptions {
  disabled: boolean;
  cta?: boolean; // Является ли кнопка основной (call to action)
  text?: string; // Опциональный текст кнопки
}

/**
 * Параметры для обновления состояния кнопки Reset Defaults.
 */
export interface ResetDefaultsButtonStateOptions {
  disabled: boolean;
  text?: string; // Опциональный текст кнопки
}


/**
 * Отвечает за создание и управление кнопками
 * "Apply Changes", "Reset changes", "Reset to defaults" на вкладке настроек.
 */
export class SettingsControls {
  private applyButton: ButtonComponent;
  private resetButton: ButtonComponent; // Кнопка "Reset changes"
  private resetDefaultsButton: ButtonComponent;

  private readonly defaultApplyText = "Apply Changes";
  private readonly defaultResetDefaultsText = "Reset to defaults";

  constructor(container: HTMLElement, private actions: ISettingsControlActions) {
    const buttonGroup = new Setting(container)
      .setClass('checkbox-sync-button-group');

    // Кнопка "Reset changes"
    buttonGroup.addButton(button => {
      this.resetButton = button; // Сохраняем ссылку (хотя она пока не используется)
      button
        .setButtonText("Reset changes")
        .setTooltip("Revert changes to the last applied settings")
        .onClick(async () => {
          // Просто вызываем переданный колбэк
          await this.actions.onReset();
        });
    });

    // Кнопка "Reset to defaults"
    buttonGroup.addButton(button => {
      this.resetDefaultsButton = button;
      button
        .setButtonText(this.defaultResetDefaultsText)
        .setTooltip("Reset all settings to default values and apply immediately")
        .onClick(async () => {
          // Вызываем асинхронный колбэк (который внутри покажет ConfirmModal)
          await this.actions.onResetDefaults();
        });
    });

    // Кнопка "Apply Changes" (последняя для акцента)
    buttonGroup.addButton(button => {
      this.applyButton = button;
      button
        .setButtonText(this.defaultApplyText)
        .setDisabled(true) // По умолчанию выключена
        .onClick(async () => {
          // Вызываем асинхронный колбэк
          await this.actions.onApply();
        });
    });
  }

  /**
   * Обновляет состояние кнопки "Apply Changes".
   * @param options Параметры состояния.
   */
  public setApplyState(options: ApplyButtonStateOptions): void {
    if (!this.applyButton) return;

    this.applyButton.setDisabled(options.disabled);

    if (options.text !== undefined) {
      this.applyButton.setButtonText(options.text);
    } else {
      // Возвращаем текст по умолчанию, если новый не задан
      this.applyButton.setButtonText(this.defaultApplyText);
    }

    if (options.cta === true && !options.disabled) {
      this.applyButton.setCta();
    } else {
      this.applyButton.removeCta();
    }
  }

  /**
   * Обновляет состояние кнопки "Reset to defaults".
   * @param options Параметры состояния.
   */
  public setResetDefaultsState(options: ResetDefaultsButtonStateOptions): void {
    if (!this.resetDefaultsButton) return;

    this.resetDefaultsButton.setDisabled(options.disabled);

    if (options.text !== undefined) {
      this.resetDefaultsButton.setButtonText(options.text);
    } else {
      // Возвращаем текст по умолчанию
      this.resetDefaultsButton.setButtonText(this.defaultResetDefaultsText);
    }
  }
}