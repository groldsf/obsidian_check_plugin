import { App, ButtonComponent, DropdownComponent, Notice, PluginSettingTab, Setting, TextComponent, ToggleComponent } from "obsidian";
import CheckboxSyncPlugin from "../main";
import { CheckboxState, DEFAULT_SETTINGS } from "../types";
import { ConfirmModal, InfoModal, SaveConfirmModal } from "./modals";
import { Mutex } from "async-mutex";

export class CheckboxSyncPluginSettingTab extends PluginSettingTab {
  plugin: CheckboxSyncPlugin;
  private checkedSymbolsInput: TextComponent;
  private uncheckedSymbolsInput: TextComponent;
  private ignoreSymbolsInput: TextComponent;
  private unknownPolicyDropdown: DropdownComponent;
  private parentToggle: ToggleComponent;
  private childToggle: ToggleComponent;
  private enableAutomaticFileSyncToggle: ToggleComponent;
  private applyButton: ButtonComponent;
  private resetToDefaultButton: ButtonComponent;
  private errorDisplayEl: HTMLElement;
  private isDirty: boolean = false;
  private actionMutex = new Mutex();

  constructor(app: App, plugin: CheckboxSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
  * Parses a string expecting a JSON array of single-character strings.
  */
  private parseJsonStringArray(value: string): { result: string[], error?: string } {
    if (value == null || typeof value !== 'string') {
      return { result: [], error: "Input must be a string." };
    }
    const trimmedValue = value.trim();
    if (trimmedValue === '') {
      return { result: [] };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(trimmedValue);
    } catch (e: any) {
      return { result: [], error: `Invalid JSON format: ${e.message}` };
    }

    if (!Array.isArray(parsed)) {
      return { result: [], error: "Invalid format: Input must be a valid JSON array (e.g., [\"x\", \" \"] )." };
    }

    const symbols = new Set<string>();
    for (let i = 0; i < parsed.length; i++) {
      const element = parsed[i];
      if (typeof element !== 'string') {
        return { result: [], error: `Invalid content: Array element at index ${i} is not a string.` };
      }
      if (element.length !== 1) {
        return { result: [], error: `Invalid content: Element "${element}" at index ${i} must be a single character.` };
      }
      symbols.add(element);
    }

    return { result: [...symbols] }; // Возвращаем массив уникальных символов
  }

  private arrayToJsonString(symbols: string[] | undefined): string {
    if (!symbols || symbols.length === 0) {
      return '[]';
    }
    try {
      // Используем форматирование с отступами для лучшей читаемости в TextArea
      return JSON.stringify(symbols);
    } catch (e) {
      // На случай, если в массиве окажется что-то несериализуемое (хотя не должно)
      console.error("Error stringifying array to JSON:", e);
      return '[]';
    }
  }

  private validateSettingsArraysIntersection(checkedSymbols: string[], uncheckedSymbols: string[]): { isValid: boolean; error?: string } {
    const intersection = checkedSymbols.filter(symbol => uncheckedSymbols.includes(symbol));
    if (intersection.length > 0) {
      const displayIntersection = this.arrayToJsonString(intersection); // Используем JSON для вывода ошибки
      return { isValid: false, error: `Validation error: Symbol(s) found in both lists: ${displayIntersection}` };
    }
    return { isValid: true };
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
    containerEl.createEl('h3', { text: 'Checkbox Symbol Configuration (Advanced: JSON)' });
    containerEl.createEl('p', { text: 'Warning: Requires valid JSON format. Use double quotes for strings.' });

    // --- Checked Symbols ---
    new Setting(containerEl)
      .setName("Checked Symbols")
      .setDesc("Enter symbols as a JSON array of single-character strings. Example: [\"x\", \"✓\", \" \"]")
      .addText((text) => {
        this.checkedSymbolsInput = text;
        text
          .setPlaceholder("e.g., [\"x\", \" \"]")
          .setValue(this.arrayToJsonString(this.plugin.settings.checkedSymbols))
          .onChange(() => this.settingChanged())
      });

    // --- Unchecked Symbols ---
    new Setting(containerEl)
      .setName("Unchecked Symbols")
      .setDesc("Enter symbols as a JSON array of single-character strings. Example: [\" \", \"?\", \",\"]")
      .addText((text) => {
        this.uncheckedSymbolsInput = text;
        text
          .setPlaceholder("e.g., [\" \", \"?\", \",\"]")
          .setValue(this.arrayToJsonString(this.plugin.settings.uncheckedSymbols))
          .onChange(() => this.settingChanged())
      });

    // --- Ignore Symbols ---
    new Setting(containerEl)
      .setName("Ignore Symbols")
      .setDesc("Checkboxes with these symbols will be ignored during automatic parent/child state updates. Example: [\"-\", \"~\"]")
      .addText((text) => {
        this.ignoreSymbolsInput = text; // Сохраняем ссылку
        text
          .setPlaceholder("e.g., [\"-\", \"~\"]")
          .setValue(this.arrayToJsonString(this.plugin.settings.ignoreSymbols))
          .onChange(() => this.settingChanged())
      });

    // --- Unknown Symbol Policy ---
    new Setting(containerEl)
      .setName('Unknown Symbol Policy')
      .setDesc('How to treat symbols not in Checked or Unchecked lists.')
      .addDropdown(dropdown => {
        this.unknownPolicyDropdown = dropdown;
        dropdown
          .addOption(CheckboxState.Checked, 'Treat as Checked')
          .addOption(CheckboxState.Unchecked, 'Treat as Unchecked')
          .addOption(CheckboxState.Ignore, 'Ignore')
          .setValue(this.plugin.settings.unknownSymbolPolicy)
          .onChange(() => this.settingChanged())
      });


    containerEl.createEl('h3', { text: 'Synchronization Behavior' });
    // --- Parent State Toggle ---
    new Setting(containerEl)
      .setName('Update parent checkbox state automatically')
      .setDesc('If enabled, the state of a parent checkbox will be automatically updated based on the state of its children (all children checked = parent checked). If disabled, only manually changing a parent will affect its children.')
      .addToggle(toggle => {
        this.parentToggle = toggle;
        toggle
          .setValue(this.plugin.settings.enableAutomaticParentState)
          .onChange(() => this.settingChanged())
      });


    // --- Child State Toggle ---
    new Setting(containerEl)
      .setName('Update child checkbox state automatically')
      .setDesc('If enabled, changing the state of a parent checkbox will automatically update the state of all its direct and nested children. If disabled, changing a parent checkbox will not affect its children.')
      .addToggle(toggle => {
        this.childToggle = toggle;
        toggle
          .setValue(this.plugin.settings.enableAutomaticChildState)
          .onChange(() => this.settingChanged())
      });

    new Setting(containerEl)
      .setName("Enable automatic file synchronization")
      .setDesc("If enabled (requires restart or settings reload), automatically syncs checkbox states when files are loaded/opened and after settings changes. If disabled (default), sync only occurs when you manually change a checkbox.")
      .addToggle(toggle => {
        this.enableAutomaticFileSyncToggle = toggle;
        toggle
          .setValue(this.plugin.settings.enableAutomaticFileSync)
          .onChange(() => this.settingChanged());
      });


    // --- Область для вывода ошибок ---
    this.errorDisplayEl = containerEl.createDiv({ cls: 'checkbox-sync-settings-error' });
    // Используем стандартные CSS переменные Obsidian для цвета ошибки
    this.errorDisplayEl.style.color = 'var(--text-error)';
    this.errorDisplayEl.style.marginTop = '10px';
    this.errorDisplayEl.style.marginBottom = '10px';
    this.errorDisplayEl.style.minHeight = '1.5em'; // Резервируем место
    this.errorDisplayEl.style.whiteSpace = 'pre-wrap'; // Для переноса длинных ошибок
    this.errorDisplayEl.style.userSelect = 'text'; // или 'all'

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


      try {
        await this.validateAndSaveSettings();

        this.checkedSymbolsInput.setValue(this.arrayToJsonString(this.plugin.settings.checkedSymbols));
        this.uncheckedSymbolsInput.setValue(this.arrayToJsonString(this.plugin.settings.uncheckedSymbols));
        this.ignoreSymbolsInput.setValue(this.arrayToJsonString(this.plugin.settings.ignoreSymbols));

        this.settingSaved();
        this.errorDisplayEl.setText('');
        new Notice("Checkbox Sync settings applied!", 3000);
      } catch (error: any) {
        // --- Ошибка ---
        console.error("Error applying checkbox sync settings:", error);
        // Выводим ошибку в специальный div
        this.errorDisplayEl.setText(`❌ ${error.message || "An unknown error occurred."}`);
      } finally {
        this.applyButton.setButtonText(originalButtonText); // Восстанавливаем текст
      }
    });
  }

  /**
   * Resets the settings UI elements to reflect the currently saved plugin settings.
   */
  private resetInputsToSavedSettings() {
    const settings = this.plugin.settings; // Получаем текущие сохраненные настройки

    // Обновляем значения всех полей ввода
    this.checkedSymbolsInput.setValue(this.arrayToJsonString(settings.checkedSymbols));
    this.uncheckedSymbolsInput.setValue(this.arrayToJsonString(settings.uncheckedSymbols));
    this.ignoreSymbolsInput.setValue(this.arrayToJsonString(settings.ignoreSymbols));
    this.unknownPolicyDropdown.setValue(settings.unknownSymbolPolicy);
    this.parentToggle.setValue(settings.enableAutomaticParentState);
    this.childToggle.setValue(settings.enableAutomaticChildState);
    this.enableAutomaticFileSyncToggle.setValue(settings.enableAutomaticFileSync);

    // Очищаем ошибку и сбрасываем состояние "грязный"
    this.errorDisplayEl?.setText('');
    this.settingSaved(); // Используем существующий метод для сброса isDirty и состояния кнопки Apply
  }

  /**
   * Applies the default settings immediately after confirmation.
   */
  private async applyDefaultSettings() {
    await this.actionMutex.runExclusive(async () => {
      this.resetToDefaultButton.setDisabled(true).setButtonText("Resetting...");

      this.errorDisplayEl.setText(''); // Очищаем предыдущие ошибки

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
        this.errorDisplayEl.setText(`❌ Error resetting to defaults: ${error.message}`);
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
  private async validateAndSaveSettings(): Promise<void> {
    // 1. Считываем значения из UI
    const checkedValue = this.checkedSymbolsInput.getValue();
    const uncheckedValue = this.uncheckedSymbolsInput.getValue();
    const ignoreValue = this.ignoreSymbolsInput.getValue();
    const policyValue = this.unknownPolicyDropdown.getValue() as CheckboxState;
    const parentValue = this.parentToggle.getValue();
    const childValue = this.childToggle.getValue();
    const automaticFileSyncValue = this.enableAutomaticFileSyncToggle.getValue();

    // 2. Парсим JSON
    const parsedChecked = this.parseJsonStringArray(checkedValue);
    const parsedUnchecked = this.parseJsonStringArray(uncheckedValue);
    const parsedIgnore = this.parseJsonStringArray(ignoreValue);

    // 3. Проверяем ошибки парсинга -> throw
    if (parsedChecked.error) {
      throw new Error(`Checked Symbols Error: ${parsedChecked.error}`);
    }
    if (parsedUnchecked.error) {
      throw new Error(`Unchecked Symbols Error: ${parsedUnchecked.error}`);
    }
    if (parsedIgnore.error) {
      throw new Error(`Ignore Symbols Error: ${parsedIgnore.error}`);
    }

    const checkedSymbolsArray = parsedChecked.result;
    const uncheckedSymbolsArray = parsedUnchecked.result;
    const ignoreSymbolsArray = parsedIgnore.result;

    // 4. Валидируем пересечение -> throw
    const intersectionValidation1 = this.validateSettingsArraysIntersection(checkedSymbolsArray, uncheckedSymbolsArray);
    if (!intersectionValidation1.isValid) {
      throw new Error(`Lists: checked and unchecked. ${intersectionValidation1.error!}`);
    }
    const intersectionValidation2 = this.validateSettingsArraysIntersection(checkedSymbolsArray, ignoreSymbolsArray);
    if (!intersectionValidation2.isValid) {
      throw new Error(`Lists: checked and ignore. ${intersectionValidation2.error!}`);
    }
    const intersectionValidation3 = this.validateSettingsArraysIntersection(uncheckedSymbolsArray, ignoreSymbolsArray);
    if (!intersectionValidation3.isValid) {
      throw new Error(`Lists: unchecked and ignore. ${intersectionValidation3.error!}`);
    }

    // 5. Валидируем на пустые списки -> throw
    if (checkedSymbolsArray.length === 0) {
      throw new Error("Checked symbols list cannot be empty.");
    }
    if (uncheckedSymbolsArray.length === 0) {
      throw new Error("Unchecked symbols list cannot be empty.");
    }

    // 6. Вызываем сохранение -> await (может кинуть ошибку)
    await this.plugin.updateSettings(settings => {
      settings.checkedSymbols = checkedSymbolsArray;
      settings.uncheckedSymbols = uncheckedSymbolsArray;
      settings.ignoreSymbols = ignoreSymbolsArray;
      settings.unknownSymbolPolicy = policyValue;
      settings.enableAutomaticParentState = parentValue;
      settings.enableAutomaticChildState = childValue;
      settings.enableAutomaticFileSync = automaticFileSyncValue;
    });
  }
}