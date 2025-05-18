import { Plugin, TFile } from "obsidian";
import { CheckboxUtils } from "./checkboxUtils";
import { FileChangeEventHandler } from "./events/FileChangeEventHandler";
import { FileLoadEventHandler } from "./events/FileLoadEventHandler";
import FileStateHolder from "./FileStateHolder";
import { CheckboxSyncPluginSettingTab } from "./ui/CheckboxSyncPluginSettingTab";
import SyncController from "./SyncController";
import { CheckboxSyncPluginSettings, DEFAULT_SETTINGS } from "./types";
import { FileFilter } from "./FileFilter";

const DEBUG_FLAG_NAME = 'CHECKBOX_SYNC_DEBUG';

// --- Объявление глобальной переменной для TypeScript ---
// Это нужно, чтобы TypeScript не ругался на window[DEBUG_FLAG_NAME]
declare global {
	interface Window {
		[key: string]: any; // Позволяем индексировать window строкой
	}
}

export default class CheckboxSyncPlugin extends Plugin {
	private _settings: CheckboxSyncPluginSettings;

	private syncController: SyncController;
	private checkboxUtils: CheckboxUtils;
	private fileStateHolder: FileStateHolder;
	private fileLoadEventHandler: FileLoadEventHandler;
	private fileChangeEventHandler: FileChangeEventHandler;
	private fileFilter: FileFilter;

	async onload() {
		await this.loadSettings();

		this.fileFilter = new FileFilter(this.settings);
		this.fileStateHolder = new FileStateHolder(this.app.vault);
		this.checkboxUtils = new CheckboxUtils(this.settings);
		this.syncController = new SyncController(this.app.vault, this.checkboxUtils, this.fileStateHolder);
		this.fileLoadEventHandler = new FileLoadEventHandler(this, this.app, this.syncController, this.fileStateHolder);
		this.fileChangeEventHandler = new FileChangeEventHandler(this, this.app, this.syncController, this.fileStateHolder);

		this.addSettingTab(new CheckboxSyncPluginSettingTab(this.app, this));
		this.fileLoadEventHandler.registerEvents();
		this.fileChangeEventHandler.registerEvents();
	}

	async loadSettings() {
		this._settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.setDebugFlag(this.settings.consoleEnabled);
	}

	get settings(): Readonly<CheckboxSyncPluginSettings> {
		return this._settings;
	}

	async updateSettings(callback: (settings: CheckboxSyncPluginSettings) => void | Promise<void>) {
		await callback(this._settings);
		this.setDebugFlag(this.settings.consoleEnabled);
		this.fileFilter.updateSettings(this.settings);
		await this.saveData(this.settings);

		

		if (this.settings.enableAutomaticFileSync) {
			//надо пересинхронизировать все файлы в кеше
			const allFile = this.fileStateHolder.getAllFiles();
			await Promise.all(
				allFile.map(async (file: TFile) => {
					await this.syncController.syncFile(file);
				})
			);
		}
	}

	private setDebugFlag(enabled: boolean) {
		window[DEBUG_FLAG_NAME] = enabled;
	}
}
