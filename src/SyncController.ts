import { Mutex } from "async-mutex";
import { Editor, EditorChange, MarkdownFileInfo, MarkdownView, TFile, Vault } from "obsidian";
import { CheckboxUtils } from "./checkboxUtils";
import FileStateHolder from "./FileStateHolder";
import { FileFilter } from "./FileFilter";

export default class SyncController {
	// private plugin: CheckboxSyncPlugin;//delete
	private vault: Vault;
	private checkboxUtils: CheckboxUtils;
	private fileStateHolder: FileStateHolder;
	private fileFilter: FileFilter;

	private mutex: Mutex;

	constructor(vault: Vault, checkboxUtils: CheckboxUtils, fileStateHolder: FileStateHolder, fileFilter: FileFilter) {
		// this.plugin = plugin;//delete
		this.vault = vault;
		this.checkboxUtils = checkboxUtils;
		this.fileStateHolder = fileStateHolder;
		this.fileFilter = fileFilter;
		this.mutex = new Mutex();
	}

	async syncEditor(editor: Editor, info: MarkdownView | MarkdownFileInfo) {
		if (!info.file) {
			return;
		}
		await this.mutex.runExclusive(async () => {
			const file = info.file!;
			console.log(`sync editor "${file.path}" start.`);

			const text = editor.getValue();

			if (!this.fileFilter.isPathAllowed(file.path)) {
				console.log(`sync editor "${file.path}" skip, path is not allowed.`);
				this.fileStateHolder.set(file, text);
				return;
			}

			const textBefore = this.fileStateHolder.get(file);

			let newText = this.checkboxUtils.syncText(text, textBefore);
			this.fileStateHolder.set(file, newText);

			if (newText === text) {
				console.log(`sync editor "${file.basename}" stop. new text equals old text.`);
			} else {
				this.editEditor(editor, text, newText);
				console.log(`syncEditor "${file.basename}" stop.`);
			}
		});
	}

	async syncFile(file: TFile | null) {
		if (!(file instanceof TFile) || file.extension !== "md") {
			return;
		}
		await this.mutex.runExclusive(async () => {
			console.log(`sync file "${file.path}" start.`);

			if (!this.fileFilter.isPathAllowed(file.path)) {
				console.log(`sync file "${file.path}" skip, path is not allowed.`);
				const text = await this.vault.read(file);
				this.fileStateHolder.set(file, text);
			} else {
				const newText = await this.vault.process(file, (text) => {
					let textBefore = this.fileStateHolder.get(file);
					let newText = this.checkboxUtils.syncText(text, textBefore);
					return newText;
				});
				this.fileStateHolder.set(file, newText);
			}
			console.log(`sync file "${file.basename}" stop.`);
		});
	}

	private editEditor(editor: Editor, oldText: string, newText: string) {
		const cursor = editor.getCursor();

		const newLines = newText.split("\n");
		const oldLines = oldText.split("\n");

		const diffIndexes = this.checkboxUtils.findDifferentLineIndexes(oldLines, newLines);

		const changes: EditorChange[] = [];

		for (let ind of diffIndexes) {
			changes.push({
				from: { line: ind, ch: 0 },
				to: { line: ind, ch: oldLines[ind].length },
				text: newLines[ind]
			});
		}
		editor.transaction({
			changes: changes
		});

		editor.setCursor(cursor);

		const lastDifferentLineIndex = diffIndexes.length > 0 ? diffIndexes[0] : -1;
		if (lastDifferentLineIndex != -1) {
			editor.scrollIntoView({
				from: { line: lastDifferentLineIndex, ch: 0 },
				to: { line: lastDifferentLineIndex, ch: 0 }
			});
		}
	}

}
