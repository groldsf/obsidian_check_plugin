import { App, ButtonComponent, DropdownComponent, Notice, PluginSettingTab, Setting, TextComponent, ToggleComponent } from "obsidian";
import CheckboxSyncPlugin from "./main";
import { UnknownSymbolPolicy } from "./types";

export class CheckboxSyncPluginSettingTab extends PluginSettingTab {
  plugin: CheckboxSyncPlugin;
  private checkedSymbolsInput: TextComponent;
  private uncheckedSymbolsInput: TextComponent;
  private unknownPolicyDropdown: DropdownComponent;
  private parentToggle: ToggleComponent;
  private childToggle: ToggleComponent;
  private applyButton: ButtonComponent;
  private errorDisplayEl: HTMLElement;

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
      return { isValid: false, error: `Validation error: Symbol(s) found in both Checked and Unchecked lists: ${displayIntersection}` };
    }
    return { isValid: true };
  }

  display(): void {
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
          .onChange(() => this.applyButton.setDisabled(false))
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
          .onChange(() => this.applyButton.setDisabled(false))
      });

    // --- Unknown Symbol Policy ---
    new Setting(containerEl)
      .setName('Unknown Symbol Policy')
      .setDesc('How to treat symbols not in Checked or Unchecked lists.')
      .addDropdown(dropdown => {
        this.unknownPolicyDropdown = dropdown;
        dropdown
          .addOption('checked', 'Treat as Checked')
          .addOption('unchecked', 'Treat as Unchecked')
          .addOption('ignore', 'Ignore')
          .setValue(this.plugin.settings.unknownSymbolPolicy)
          .onChange(() => this.applyButton.setDisabled(false))
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
          .onChange(() => this.applyButton.setDisabled(false))
      });


    // --- Child State Toggle ---
    new Setting(containerEl)
      .setName('Update child checkbox state automatically')
      .setDesc('If enabled, changing the state of a parent checkbox will automatically update the state of all its direct and nested children. If disabled, changing a parent checkbox will not affect its children.')
      .addToggle(toggle => {
        this.childToggle = toggle;
        toggle
          .setValue(this.plugin.settings.enableAutomaticChildState)
          .onChange(() => this.applyButton.setDisabled(false))
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

    // --- Кнопка Применить ---
    new Setting(containerEl)
      .addButton(button => {
        this.applyButton = button;
        button
          .setButtonText("Apply Changes")
          .setCta() // Делает кнопку более заметной (синей)
          .setDisabled(true)
          .onClick(async () => await this.applyChanges())
      });
  }

  private async applyChanges() {
    const originalButtonText = "Apply Changes";
    this.applyButton.setDisabled(true).setButtonText("Applying...");

    try {
      const checkedValue = this.checkedSymbolsInput.getValue();
      const uncheckedValue = this.uncheckedSymbolsInput.getValue();
      const policyValue = this.unknownPolicyDropdown.getValue() as UnknownSymbolPolicy;
      const parentValue = this.parentToggle.getValue();
      const childValue = this.childToggle.getValue();

      const parsedChecked = this.parseJsonStringArray(checkedValue);
      const parsedUnchecked = this.parseJsonStringArray(uncheckedValue);

      if (parsedChecked.error) {
        throw new Error(`Checked Symbols Error: ${parsedChecked.error}`);
      }
      if (parsedUnchecked.error) {
        throw new Error(`Unchecked Symbols Error: ${parsedUnchecked.error}`);
      }

      const checkedSymbolsArray = parsedChecked.result;
      const uncheckedSymbolsArray = parsedUnchecked.result;

      const intersectionValidation = this.validateSettingsArraysIntersection(checkedSymbolsArray, uncheckedSymbolsArray);
      if (!intersectionValidation.isValid) {
        throw new Error(intersectionValidation.error!);
      }

      if (checkedSymbolsArray.length === 0) {
        throw new Error("Checked symbols list cannot be empty.")
      }
      if (uncheckedSymbolsArray.length === 0) {
        throw new Error("Unchecked symbols list cannot be empty.");
      }


      await this.plugin.updateSettings(settings => {
        settings.checkedSymbols = checkedSymbolsArray;
        settings.uncheckedSymbols = uncheckedSymbolsArray;
        settings.unknownSymbolPolicy = policyValue;
        settings.enableAutomaticParentState = parentValue;
        settings.enableAutomaticChildState = childValue;
        console.log(JSON.stringify(settings));
      });

      // 8. Обновляем поля ввода каноническим JSON (на случай исправлений парсером)
      this.checkedSymbolsInput.setValue(this.arrayToJsonString(checkedSymbolsArray));
      this.uncheckedSymbolsInput.setValue(this.arrayToJsonString(uncheckedSymbolsArray));

      this.errorDisplayEl.setText('');
      this.applyButton.setButtonText(originalButtonText);

      new Notice("Checkbox Sync settings applied!", 3000);
    } catch (error: any) {
      // --- Ошибка ---
      console.error("Error applying checkbox sync settings:", error);
      // Выводим ошибку в специальный div
      this.errorDisplayEl?.setText(`❌ ${error.message || "An unknown error occurred."}`);
      this.applyButton?.setButtonText(originalButtonText); // Восстанавливаем текст
    }
  }
}