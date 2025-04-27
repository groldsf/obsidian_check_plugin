import { Mutex } from "async-mutex";
import { App, ButtonComponent, Notice, PluginSettingTab, Setting } from "obsidian";
import CheckboxSyncPlugin from "../main";
import { CheckboxSyncPluginSettings, DEFAULT_SETTINGS } from "../types";
import { ErrorDisplay } from "./ErrorDisplay";
import { SettingGroup } from "./SettingGroup";
import { CheckedSymbolsSettingComponent } from "./components/CheckedSymbolsSettingComponent";
import { EnableChildSyncSettingComponent } from "./components/EnableChildSyncSettingComponent";
import { EnableFileSyncSettingComponent } from "./components/EnableFileSyncSettingComponent";
import { EnableParentSyncSettingComponent } from "./components/EnableParentSyncSettingComponent";
import { IgnoreSymbolsSettingComponent } from "./components/IgnoreSymbolsSettingComponent";
import { UncheckedSymbolsSettingComponent } from "./components/UncheckedSymbolsSettingComponent";
import { UnknownPolicySettingComponent } from "./components/UnknownPolicySettingComponent";
import { ConfirmModal, InfoModal, SaveConfirmModal } from "./modals";
import { SettingsValidator } from "./validation/SettingsValidator";
import { ValidationError } from "./validation/types";

export class CheckboxSyncPluginSettingTab extends PluginSettingTab {
  plugin: CheckboxSyncPlugin;

  private settingGroups: SettingGroup[] = []

  private applyButton: ButtonComponent;
  private resetToDefaultButton: ButtonComponent;

  private errorDisplay: ErrorDisplay;

  private isDirty: boolean = false;
  private actionMutex = new Mutex();

  constructor(app: App, plugin: CheckboxSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.initializeSettingGroups();
  }

  // Метод для создания и конфигурации групп и компонентов
  private initializeSettingGroups(): void {
    // Создаем экземпляры наших компонентов

    const checkedSymbolsComp = new CheckedSymbolsSettingComponent();
    checkedSymbolsComp.setChangeListener(() => this.settingChanged());

    const uncheckedSymbolsComp = new UncheckedSymbolsSettingComponent();
    uncheckedSymbolsComp.setChangeListener(() => this.settingChanged());

    const unknownPolicyComp = new UnknownPolicySettingComponent();
    unknownPolicyComp.setChangeListener(() => this.settingChanged());

    const ignoreSymbolsComp = new IgnoreSymbolsSettingComponent();
    ignoreSymbolsComp.setChangeListener(() => this.settingChanged());

    const symbolGroup = new SettingGroup(
      "Checkbox Symbol Configuration (Advanced: JSON)",
      [checkedSymbolsComp, uncheckedSymbolsComp, ignoreSymbolsComp, unknownPolicyComp],
      "Warning: Requires valid JSON format. Use double quotes for strings."
    );

    const parentToggleComp = new EnableParentSyncSettingComponent();
    parentToggleComp.setChangeListener(() => this.settingChanged());

    const childrenToggleComp = new EnableChildSyncSettingComponent();
    childrenToggleComp.setChangeListener(() => this.settingChanged());

    const automaticFileSyncToggleComp = new EnableFileSyncSettingComponent();
    automaticFileSyncToggleComp.setChangeListener(() => this.settingChanged());

    const behaviorGroup = new SettingGroup(
      "Synchronization Behavior",
      [parentToggleComp, childrenToggleComp, automaticFileSyncToggleComp]
    );

    // Сохраняем созданную группу (или группы) в поле класса
    this.settingGroups = [
      symbolGroup,
      behaviorGroup
    ];
  }

  private settingChanged() {
    this.isDirty = true;
    this.applyButton.setDisabled(false).setCta();
  }

  private settingSaved() {
    this.isDirty = false;
    this.applyButton.setDisabled(true).removeCta();
  }

  display(): void {
    this.isDirty = false;
    const containerEl = this.containerEl;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Checkbox Sync Settings' });

    for (const group of this.settingGroups) {
      group.render(containerEl, this.plugin.settings);
    }

    // --- Область для вывода ошибок ---
    this.errorDisplay = new ErrorDisplay(containerEl);

    // Используем Setting для группировки кнопок
    const buttonGroup = new Setting(containerEl)
      .setClass('checkbox-sync-button-group'); // Добавим класс для возможной стилизации


    buttonGroup.addButton(button => {
      button
        .setButtonText("Reset changes")
        .setTooltip("Revert changes to the last applied settings")
        .onClick(() => {
          this.resetInputsToSavedSettings();
        });
    });

    buttonGroup.addButton(button => {
      this.resetToDefaultButton = button;
      button
        .setButtonText("Reset to defaults")
        .setTooltip("Reset all settings to default values and apply immediately")
        .onClick(() => {
          new ConfirmModal(this.app,
            "Reset all settings to default and apply immediately?\nThis cannot be undone.", // Добавил \n для переноса
            async () => { await this.applyDefaultSettings(); }
          ).open();
        });
    });
    // --- Кнопка Применить ---
    buttonGroup
      .addButton(button => {
        this.applyButton = button;
        button
          .setButtonText("Apply Changes")
          .setDisabled(!this.isDirty)
          .onClick(async () => await this.applyChanges())
      });
  }

  private async applyChanges() {
    await this.actionMutex.runExclusive(async () => {
      const originalButtonText = "Apply Changes";
      this.applyButton.setDisabled(true).setButtonText("Applying...").removeCta();
      this.errorDisplay.clear();

      try {
        const result = await this.validateAndSaveSettings();
        if (result.success) {
          this.settingSaved();
          new Notice("Checkbox Sync settings applied!", 3000);
        } else {
          console.warn("Validation errors:", result.errors);
          this.errorDisplay.displayErrors(result.errors);
        }
      } catch (error: any) {
        console.error("Unexpected error during applyChanges:", error);
        const message = error.message || "Unknown error";
        this.errorDisplay.displayMessage(`An unexpected error occurred: ${message}`);
        this.applyButton.setDisabled(false).setCta();
      } finally {
        this.applyButton.setButtonText(originalButtonText); // Восстанавливаем текст
      }
    });
  }

  /**
   * Resets the settings UI elements to reflect the currently saved plugin settings.
   */
  private resetInputsToSavedSettings() {
    const settings = this.plugin.settings;

    for (const group of this.settingGroups) {
      for (const component of group.components) {
        const key = component.getSettingKey();
        if (key in settings) {
          try {
            component.setValueInUi(settings[key]);
          } catch (error) {
            console.error(`Error resetting UI for component ${key}:`, error);
          }
        }
      }
    }

    // Очищаем ошибку и сбрасываем состояние "грязный"
    this.errorDisplay.clear();
    this.settingSaved(); // Используем существующий метод для сброса isDirty и состояния кнопки Apply
  }

  /**
   * Applies the default settings immediately after confirmation.
   */
  private async applyDefaultSettings() {
    await this.actionMutex.runExclusive(async () => {
      this.resetToDefaultButton.setDisabled(true).setButtonText("Resetting...");

      this.errorDisplay.clear();// Очищаем предыдущие ошибки

      try {
        const defaultsCopy = { ...DEFAULT_SETTINGS }; // Работаем с копией

        await this.plugin.updateSettings(settings => {
          // Полностью перезаписываем текущие настройки дефолтными
          Object.assign(settings, defaultsCopy);
        });

        // После успешного сохранения обновляем UI и состояние
        this.resetInputsToSavedSettings(); // Обновит UI по новым settings и сбросит isDirty/кнопку Apply

        new Notice("Settings reset to defaults and applied.", 3000);

      } catch (error: any) {
        console.error("Error resetting settings to default:", error);
        const message = error.message || "Unknown error";
         this.errorDisplay.displayMessage(`Error resetting to defaults: ${message}`);
      } finally {
        // Восстанавливаем кнопку Reset
        this.resetToDefaultButton.setDisabled(false).setButtonText("Reset to defaults");
      }
    });
  }

  /**
   * Overridden hide method to handle unsaved changes.
   */
  async hide() {
    if (this.isDirty) {
      // Колбэк для кнопки "Save"
      const saveCallback = async () => {
        try {
          await this.validateAndSaveSettings();
          this.isDirty = false; // Сбрасываем флаг
          new Notice("Settings saved.", 2000);
        } catch (error: any) {
          console.error("Error saving settings on hide:", error);
          let errorMessage = "An unknown error occurred.";
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          // Открываем модалку с ошибкой
          new InfoModal(this.app, `Failed to save settings:\n\n${errorMessage}\n\nYour changes were not saved.`).open();
        }
      };

      // Колбэк для кнопки "Discard"
      const discardCallback = () => {
        this.isDirty = false; // Считаем изменения отмененными
      };

      // Открываем модалку Save/Discard и ЖДЕМ ее закрытия
      const saveModal = new SaveConfirmModal(this.app, saveCallback, discardCallback);
      saveModal.open();
    }
    // Продолжаем стандартное закрытие
    super.hide();
  }

  /**
   * Reads UI values, validates them, and calls plugin.updateSettings.
   * Throws an error if validation or saving fails.
   * Does NOT interact with UI feedback (buttons, notices, error display).
   */
  private async validateAndSaveSettings(): Promise<{ success: boolean; errors: ValidationError[] }> {

    let errors: ValidationError[] = []; // Массив для сбора всех ошибок валидации
    let newSettingsData: Partial<CheckboxSyncPluginSettings> = {}; // Объект для новых данных

    for (const group of this.settingGroups) {
      for (const component of group.components) {
        const key = component.getSettingKey();
        try {
          const value = component.getValueFromUi();
          const validationError = component.validate();
          if (validationError) {
            errors.push(validationError);
          } else {
            newSettingsData[key] = value;
          }
        } catch (err: any) {
          console.error(`Error processing component ${key}:`, err);
          errors.push({ field: key, message: `Failed to read value: ${err.message}` });
        }
      }
    }

    if (errors.length === 0) {
      const settingsValidator = new SettingsValidator();
      const crossErrors = settingsValidator.validate(newSettingsData);
      errors.push(...crossErrors);
    }

    if (errors.length > 0) {
      return { success: false, errors: errors };
    }

    try {
      await this.plugin.updateSettings(settings => {
        Object.assign(settings, newSettingsData);
      });
      return { success: true, errors: [] };
    } catch (saveError: any) {
      // Ловим ТОЛЬКО ошибки сохранения (от updateSettings)
      console.error("Error saving settings:", saveError);
      throw saveError;
    }
  }
}