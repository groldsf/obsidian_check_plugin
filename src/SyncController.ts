import { Mutex } from "async-mutex";
import { Editor, EditorChange, MarkdownFileInfo, MarkdownView, TFile, Vault } from "obsidian";
import TextSyncPipeline from "./TextSyncPipeline";

export default class SyncController {
	private vault: Vault;
	textSyncPipeline: TextSyncPipeline

	private mutex: Mutex;

	constructor(vault: Vault, textSyncPipeline: TextSyncPipeline) {
		this.vault = vault;
		this.textSyncPipeline = textSyncPipeline;
		this.mutex = new Mutex();
	}

	async syncEditor(editor: Editor, info: MarkdownView | MarkdownFileInfo) {
		if (!info.file) {
			return;
		}
		await this.mutex.runExclusive(async () => {
			const currentText = editor.getValue();
			const resultingText = this.textSyncPipeline.applySyncLogic(currentText, info.file!.path);
			if (resultingText !== currentText) {
				await this.editEditor(editor, info as MarkdownView, currentText, resultingText);
			}
		});
	}

	async syncFile(file: TFile | null) {
		if (!(file instanceof TFile) || file.extension !== "md") {
			return;
		}
		await this.mutex.runExclusive(async () => {
			await this.vault.process(file, (currentText) => {
				return this.textSyncPipeline.applySyncLogic(currentText, file.path);
			});
		});
	}

	private async editEditor(editor: Editor, info: MarkdownView, oldText: string, newText: string) {
		const cursor = editor.getCursor();

		const newLines = newText.split("\n");
		const oldLines = oldText.split("\n");

		const diffIndexes = this.findDifferentLineIndexes(oldLines, newLines);

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
		await info.save();
	}

	private findDifferentLineIndexes(lines1: string[], lines2: string[]): number[] {
		if (lines1.length !== lines2.length) {
			throw new Error("the length of the lines must be equal");
		}

		const length = lines1.length;
		const result: number[] = [];
		for (let i = 0; i < length; i++) {
			if (lines1[i] !== lines2[i]) {
				result.push(i);
			}
		}
		return result;
	}

}
