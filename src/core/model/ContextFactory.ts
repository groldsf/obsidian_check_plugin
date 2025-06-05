import { CheckboxSyncPluginSettings } from "src/types";
import { Context } from "./Context";
import { TreeNode } from "./TreeNode";
import { Line } from "./Line";
import { View } from "./View";

export class ContextFactory {

	private constructor() {
	}

	public static createContext(text: string, textBefore: string | undefined, settings: Readonly<CheckboxSyncPluginSettings>): Context {
		return new Context(text, textBefore, settings);
	}

	static createLines(context: Context): Line[] {
		const settings = context.getSettings();
		const textLines = context.getTextLines();
		const lines = this.createLinesFromTextLines(context.getTextLines(), settings);
		if (context.textBeforeChangeIsPresent()) {
			const textBeforeLines = context.getTextBeforeChangeLines()!;
			if (textLines.length === textBeforeLines.length) {
				const diffIndex = this.findSingleDiffLineIndex(textLines, textBeforeLines);
				if (diffIndex) {
					const oldLine = new Line(textBeforeLines[diffIndex], settings);
					const actualLine = lines[diffIndex];

					// если новая и старая строка чекбокс
					// если текст остался старым
					// если изменилось состояние чекбокса
					if (oldLine.isCheckbox() &&
						actualLine.isCheckbox() &&
						oldLine.getText() === actualLine.getText() &&
						oldLine.getState() !== actualLine.getState()
					) {
						actualLine.setChange(true);
					}
				}
			}
		}
		return lines;
	}

	static createView(context: Context) {
		const settings = context.getSettings();

		const lines = context.getLines();

		// построить дерево
		const treeNodes = this.createNodesFromLines(lines);

		// проверить ноды на modify
		let isModify = false;
		for (const treeNode of treeNodes) {
			isModify = isModify || treeNode.isModify();
		}

		return new View(treeNodes, isModify);
	}

	private static createNodesFromLines(textLines: Line[]): TreeNode[] {
		const nodes: TreeNode[] = [];
		const stack: TreeNode[] = [];
		for (let index = 0; index < textLines.length; index++) {
			const line = textLines[index];
			const node = new TreeNode(line);

			// найти родителя
			let parent = undefined;
			while (stack.length > 0) {
				const previousNode = stack[stack.length - 1];
				const previousLine = previousNode.getLine();
				if (previousLine.getIndent() < line.getIndent()) {
					parent = previousNode;
					break;
				} else {
					stack.pop();
				}
			}
			// добавить родителю, если есть
			parent?.addChildren(node);

			nodes.push(node);
			stack.push(node);
		}
		return nodes;
	}



	// создаёт Line[] из текста 
	private static createLinesFromTextLines(textLines: string[], settings: Readonly<CheckboxSyncPluginSettings>): Line[] {
		return textLines.map(line => {
			return new Line(line, settings);
		});
	}

	private static findSingleDiffLineIndex(lines1: string[], lines2: string[]): number | undefined {
		const diffLines = this.findDifferentLineIndexes(lines1, lines2);
		if (diffLines.length == 1) {
			return diffLines[0];
		}
		return undefined;
	}

	private static findDifferentLineIndexes(lines1: string[], lines2: string[]): number[] {
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

