import { Mutex } from "async-mutex";
import { App, Notice, PluginSettingTab } from "obsidian";
import CheckboxSyncPlugin from "../main";
import { CheckboxSyncPluginSettings, DEFAULT_SETTINGS } from "../types";
import { ErrorDisplay } from "./ErrorDisplay";
import { SettingGroup } from "./SettingGroup";
import { ISettingsControlActions, SettingsControls } from "./SettingsControls";
import { CheckedSymbolsSettingComponent } from "./components/checkboxSymbolConfiguration/CheckedSymbolsSettingComponent";
import { IgnoreSymbolsSettingComponent } from "./components/checkboxSymbolConfiguration/IgnoreSymbolsSettingComponent";
import { UncheckedSymbolsSettingComponent } from "./components/checkboxSymbolConfiguration/UncheckedSymbolsSettingComponent";
import { UnknownPolicySettingComponent } from "./components/checkboxSymbolConfiguration/UnknownPolicySettingComponent";
import { EnableChildSyncSettingComponent } from "./components/synchronizationBehavior/EnableChildSyncSettingComponent";
import { EnableFileSyncSettingComponent } from "./components/synchronizationBehavior/EnableFileSyncSettingComponent";
import { EnableParentSyncSettingComponent } from "./components/synchronizationBehavior/EnableParentSyncSettingComponent";
import { ConfirmModal, InfoModal, SaveConfirmModal } from "./modals";
import { SettingsValidator } from "./validation/SettingsValidator";
import { ValidationError } from "./validation/types";
import { EnableConsoleLogSettingComponent } from "./components/devGroup/EnableDebug";

export class CheckboxSyncPluginSettingTab extends PluginSettingTab {
	plugin: CheckboxSyncPlugin;

	private settingGroups: SettingGroup[] = []

	private errorDisplay: ErrorDisplay;

	private settingsControls: SettingsControls;

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
		const uncheckedSymbolsComp = new UncheckedSymbolsSettingComponent();
		const unknownPolicyComp = new UnknownPolicySettingComponent();
		const ignoreSymbolsComp = new IgnoreSymbolsSettingComponent();

		const symbolGroup = new SettingGroup(
			"Checkbox Symbol Configuration (Advanced: JSON)",
			[checkedSymbolsComp, uncheckedSymbolsComp, ignoreSymbolsComp, unknownPolicyComp],
			"Warning: Requires valid JSON format. Use double quotes for strings."
		);

		const parentToggleComp = new EnableParentSyncSettingComponent();
		const childrenToggleComp = new EnableChildSyncSettingComponent();
		const automaticFileSyncToggleComp = new EnableFileSyncSettingComponent();

		const behaviorGroup = new SettingGroup(
			"Synchronization Behavior",
			[parentToggleComp, childrenToggleComp, automaticFileSyncToggleComp]
		);

		const consoleLog = new EnableConsoleLogSettingComponent();

		const devGroup = new SettingGroup(
			"Dev",
			[consoleLog]
		);

		// Сохраняем созданную группу (или группы) в поле класса
		this.settingGroups = [
			symbolGroup,
			behaviorGroup,
			devGroup
		];

		const changeListener = () => this.settingChanged();
		for (const group of this.settingGroups) {
			for (const component of group.components) {
				// Устанавливаем общий listener для всех компонентов
				component.setChangeListener(changeListener);
			}
		}
	}

	private settingChanged() {
		this.isDirty = true;
		this.settingsControls.setApplyState({ disabled: false, cta: true });
	}

	private settingSaved() {
		this.isDirty = false;
		this.settingsControls.setApplyState({ disabled: true, cta: false });
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

		// Создаем экземпляр SettingsControls
		const controlActions: ISettingsControlActions = {
			onApply: () => this.applyChanges(),
			onReset: () => this.resetInputsToSavedSettings(),
			// Оставляем ConfirmModal здесь, но передаем вызов applyDefaultSettings
			onResetDefaults: () => {
				new ConfirmModal(this.app,
					"Reset all settings to default and apply immediately?\nThis cannot be undone.",
					// Только если пользователь нажал ОК, вызываем реальный сброс
					async () => { await this.applyDefaultSettings(); }
					// Optional: callback for cancel if needed
				).open();
			}
		};
		this.settingsControls = new SettingsControls(containerEl, controlActions);

		// Устанавливаем начальное состояние кнопки Apply
		// (isDirty здесь всегда false при первом вызове display)
		this.settingsControls.setApplyState({ disabled: !this.isDirty, cta: this.isDirty });

		// Начальное состояние кнопки Reset Defaults (всегда включена)
		this.settingsControls.setResetDefaultsState({ disabled: false });
	}

	private async applyChanges() {
		await this.actionMutex.runExclusive(async () => {
			this.settingsControls.setApplyState({ disabled: true, text: 'Applying...', cta: false });
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
			} finally {
				this.settingsControls.setApplyState({ disabled: !this.isDirty, cta: this.isDirty })
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
			this.settingsControls.setResetDefaultsState({ disabled: true, text: 'Resetting...' });
			this.errorDisplay.clear();

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
				this.settingsControls.setResetDefaultsState({ disabled: false });
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
					const result = await this.validateAndSaveSettings();
					if (result.success) {
						this.isDirty = false; // Сбрасываем флаг только при успехе
						new Notice("Settings saved.", 2000);
					} else {
						console.error("Error saving settings on hide (validation):", result.errors);
						const errorMessage = result.errors
							.map(e => `❌ ${e.field ? `[${e.field}]: ` : ''}${e.message}`)
							.join('\n');
						new InfoModal(this.app, `Failed to save settings:\n\n${errorMessage}\n\nYour changes were not saved.`).open();
					}
				} catch (error: any) {
					// Ловим НЕОЖИДАННЫЕ ошибки (например, ошибка сохранения)
					console.error("Error saving settings on hide (unexpected):", error);
					let errorMessage = "An unknown error occurred.";
					if (error instanceof Error) {
						errorMessage = error.message;
					} else if (typeof error === 'string') {
						errorMessage = error;
					}
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
