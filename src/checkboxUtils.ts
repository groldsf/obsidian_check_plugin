import { CheckboxState, CheckboxSyncPluginSettings } from "./types";

export interface CheckboxLineInfo {
	indent: number;
	marker: string;
	checkChar?: string;
	checkboxCharPosition?: number;
	checkboxState: CheckboxState;
	isChecked?: boolean | undefined;
	listItemText?: string;
}

export class CheckboxUtils {
	private settings: Readonly<CheckboxSyncPluginSettings>;
	constructor(settings: Readonly<CheckboxSyncPluginSettings>) {
		this.settings = settings;
	}

	matchCheckboxLine(line: string): CheckboxLineInfo | null {
		// const checkboxMatch = line.match(/^(\s*)([*+-]|\d+\.) \[(.)\](\s.*)?$/);
		// const checkboxMatch = line.match(/^(\s*)([*+-]|\d+\.) \[(.)\](\s|$)(.*)$/);
		const checkboxMatch = line.match(/^(\s*)([*+-]|\d+\.) \[(.)\]\s(.*)$/);
		if (checkboxMatch) {
			const indent = checkboxMatch[1].length;
			const marker = checkboxMatch[2];
			const checkChar = checkboxMatch[3];
			const checkboxCharPosition = indent + marker.length + 2;
			const checkboxState = this.getCheckboxState(checkChar);
			const isChecked = checkboxState === CheckboxState.Ignore ? undefined : checkboxState === CheckboxState.Checked;
			const listItemText = (checkboxMatch[4] || "").trimStart();

			return {
				indent,
				marker,
				checkChar,
				checkboxCharPosition,
				checkboxState,
				isChecked,
				listItemText
			};
		}
		const listItemMatch = line.match(/^(\s*)([*+-]|\d+\.)\s+(?!\[.?\])(.*)$/);
		if (listItemMatch) {
			const indent = listItemMatch[1].length;
			const marker = listItemMatch[2];
			const listItemText = listItemMatch[3].trimStart();

			return {
				indent,
				marker,
				// checkChar, checkboxCharPosition, isChecked - не применимы
				checkboxState: CheckboxState.NoCheckbox,
				listItemText
			};
		}
		return null;
	}

	getCheckboxState(text: string): CheckboxState {
		if (this.settings.checkedSymbols.includes(text)) {
			return CheckboxState.Checked;
		}
		if (this.settings.uncheckedSymbols.includes(text)) {
			return CheckboxState.Unchecked;
		}
		if (this.settings.ignoreSymbols.includes(text)) {
			return CheckboxState.Ignore;
		}
		return this.settings.unknownSymbolPolicy;
	}

	updateLineCheckboxStateWithInfo(line: string, shouldBeChecked: boolean, lineInfo: CheckboxLineInfo): string {
		if (lineInfo.checkboxState !== CheckboxState.NoCheckbox) {
			const checkedChar = this.settings.checkedSymbols.length > 0 ? this.settings.checkedSymbols[0] : 'x'; // 'x' как дефолт
			const uncheckedChar = this.settings.uncheckedSymbols.length > 0 ? this.settings.uncheckedSymbols[0] : ' '; // ' ' как дефолт

			const newCheckChar = shouldBeChecked ? checkedChar : uncheckedChar;
			const pos = lineInfo.checkboxCharPosition!;
			if (pos >= 0 && pos < line.length) {
				return line.substring(0, pos) + newCheckChar + line.substring(pos + 1);
			} else {
				console.warn("updateLineCheckboxStateWithInfo: Invalid checkbox position in lineInfo for line:", line);
				return line;
			}
		}
		console.warn("updateLineCheckboxStateWithInfo: Invalid lineInfo(no checkbox) for line:", line);
		return line;
	}

	propagateStateToChildren(text: string, parentLine: number): string {
		const lines = text.split("\n");
		const parentLineInfo = this.matchCheckboxLine(lines[parentLine]);

		if (!parentLineInfo) {
			console.warn(`checkbox not found in line ${parentLine}`)
			return text;
		}

		if (parentLineInfo.checkboxState === CheckboxState.Ignore ||
			parentLineInfo.checkboxState === CheckboxState.NoCheckbox ||
			parentLineInfo.isChecked === undefined) {
			return text;
		}
		const parentIsChecked = parentLineInfo.isChecked;

		let j = parentLine + 1;

		while (j < lines.length) {
			const childText = lines[j];
			const childLineInfo = this.matchCheckboxLine(childText);
			if (!childLineInfo || childLineInfo.indent <= parentLineInfo.indent) {
				break;
			}

			if (childLineInfo.checkboxState === CheckboxState.Ignore) {
				//skip children ignore node
				j++;
				while (j < lines.length) {
					const subChildLineInfo = this.matchCheckboxLine(lines[j]);
					if (!subChildLineInfo || subChildLineInfo.indent <= childLineInfo.indent) {
						break;
					};
					j++;
				}
			} else if (childLineInfo.checkboxState === CheckboxState.NoCheckbox) {
				j++;
			} else {
				lines[j] = this.updateLineCheckboxStateWithInfo(lines[j], parentIsChecked, childLineInfo);
				j++;
			}
		}
		return lines.join("\n");
	}

	propagateStateFromChildren(text: string): string {
		const lines = text.split("\n");

		for (let i = lines.length - 1; i >= 0; i--) {
			const parentLineInfo = this.matchCheckboxLine(lines[i]);
			if (!parentLineInfo) continue;

			if (
				parentLineInfo.checkboxState === CheckboxState.Ignore ||
				parentLineInfo.checkboxState === CheckboxState.NoCheckbox
			) {
				continue;
			}
			const parentIsChecked = parentLineInfo.isChecked!;
			let allRelevantChildrenChecked = true;
			let hasRelevantChildren = false;

			for (let j = i + 1; j < lines.length; j++) {
				const childLineInfo = this.matchCheckboxLine(lines[j]);

				if (!childLineInfo || childLineInfo.indent <= parentLineInfo.indent) break;

				if (childLineInfo.checkboxState === CheckboxState.Ignore) {
					while (j + 1 < lines.length) {
						const subChildLineInfo = this.matchCheckboxLine(lines[j + 1]);
						if (!subChildLineInfo || subChildLineInfo.indent <= childLineInfo.indent) {
							break;
						};
						j++;
					}
					continue;
				}
				if (childLineInfo.checkboxState === CheckboxState.NoCheckbox) {
					continue;
				}
				hasRelevantChildren = true;
				const childrenIsChecked = childLineInfo.isChecked!;
				if (!childrenIsChecked) {
					allRelevantChildrenChecked = false;
					break;
				}
			}

			if (hasRelevantChildren && parentIsChecked !== allRelevantChildrenChecked) {
				lines[i] = this.updateLineCheckboxStateWithInfo(lines[i], allRelevantChildrenChecked, parentLineInfo);
			}
		}
		return lines.join("\n");
	}

	syncText(text: string, textBefore: string | undefined): string {
		let newText = text;
		if (this.settings.enableAutomaticChildState) {
			newText = this.propagateStateToChildrenFromSingleDiff(text, textBefore);
		}
		if (this.settings.enableAutomaticParentState) {
			newText = this.propagateStateFromChildren(newText);
		}
		return newText;
	}

	propagateStateToChildrenFromSingleDiff(text: string, textBefore: string | undefined): string {
		if (!textBefore) return text;
		const textBeforeLines = textBefore.split('\n');
		const textLines = text.split('\n');

		if (textBeforeLines.length !== textLines.length) return text;

		const diffIndexes = this.findDifferentLineIndexes(textBeforeLines, textLines);
		if (diffIndexes.length !== 1) {
			return text;
		}

		const index = diffIndexes[0];

		const lineBefore = textBeforeLines[index];
		const lineAfter = textLines[index];
		// Получаем информацию о чекбоксе ДО и ПОСЛЕ изменения
		const lineInfoBefore = this.matchCheckboxLine(lineBefore);
		const lineInfoAfter = this.matchCheckboxLine(lineAfter);
		// Проверяем, что:
		// 1. Обе строки (до и после) являются валидными строками с чекбоксом.
		// 2. Отступ и маркер списка не изменились (т.е. структура строки та же).
		// 3. Изменился именно символ внутри скобок [ ].
		if (
			lineInfoBefore && lineInfoAfter &&
			lineInfoBefore.indent === lineInfoAfter.indent &&
			lineInfoBefore.marker === lineInfoAfter.marker &&
			lineInfoBefore.checkboxState !== lineInfoAfter.checkboxState
		) {
			return this.propagateStateToChildren(text, diffIndexes[0]);
		}
		return text;

	}

	findDifferentLineIndexes(lines1: string[], lines2: string[]): number[] {
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
