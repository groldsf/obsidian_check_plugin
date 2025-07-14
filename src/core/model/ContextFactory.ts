import { CheckboxSyncPluginSettings } from "src/types";
import { Context } from "./Context";
import { TreeNode } from "./TreeNode";
import { Line } from "./Line";
import { View } from "./View";
import { CheckboxLine } from "./line/CheckboxLine";
import { ListLine } from "./line/ListLine";
import { TextLine } from "./line/TextLine";

export class ContextFactory {


	private constructor() {
	}

	static createContext(text: string, textBefore: string | undefined, settings: Readonly<CheckboxSyncPluginSettings>): Context {
		return new Context(text, textBefore, settings);
	}

	static createView(context: Context) {
		const lines = context.getLines();
		const [rootNodes, changeNode] = this.createRootTreeNodesFromLines(lines);
		return new View(rootNodes, changeNode);
	}

	// создаёт TreeNode из Line
	// возвращает только корневые узлы и изменённую строку
	private static createRootTreeNodesFromLines(lines: Line[]): [roots: TreeNode[], changeNode: TreeNode | null] {
		const [flatTreeNodes, changeNode] = this.createFlatNodesFromLines(lines);
		const rootNodes = flatTreeNodes.filter(node => !node.getParent());
		return [rootNodes, changeNode];
	}

	// создаёт TreeNode из Line и возвращает изменённую строку если есть.
	// осторожно, возвращает ВСЕ ноды в порядке линий
	private static createFlatNodesFromLines(lines: Line[]): [treeNodes: TreeNode[], changeNode: TreeNode | null] {
		const nodes: TreeNode[] = [];
		const stack: TreeNode[] = [];

		let changeNode: null | TreeNode = null;

		for (const line of lines) {
			const node = new TreeNode(line);
			if (line instanceof CheckboxLine && line.isChange()) {
				changeNode = node;
			}

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
		return [nodes, changeNode];
	}

	static createLines(context: Context): Line[] {
		const settings = context.getSettings();
		const lines = this.createLinesFromTextLines(context.getTextLines(), settings);
		this.markChangeIfNeeded(lines, context);
		return lines;
	}

	// помечает line как изменённую при необходимости
	static markChangeIfNeeded(lines: Line[], context: Context) {
		if (!context.textBeforeChangeIsPresent()) {
			return;
		}

		const textLines = context.getTextLines();
		const textBeforeLines = context.getTextBeforeChangeLines()!;
		if (textLines.length !== textBeforeLines.length) {
			return;
		}

		const diffIndex = this.findSingleDiffLineIndex(textLines, textBeforeLines);
		if (diffIndex === undefined) {
			return;
		}

		const oldLine = this.createLineFromTextLine(textBeforeLines[diffIndex], context.getSettings());
		const actualLine = lines[diffIndex];

		// если новая и старая строка чекбокс
		if (oldLine instanceof CheckboxLine && actualLine instanceof CheckboxLine) {
			// если изменилось состояние чекбокса
			if (
				oldLine.getState() !== actualLine.getState()
			) {
				actualLine.setChange(true);
				const text = actualLine.toResultText();
				console.log(`ContextFactory:markChangeIfNeeded: ${text} is change`);
			}
		}


	}

	// создаёт Line[] из текста 
	private static createLinesFromTextLines(textLines: string[], settings: Readonly<CheckboxSyncPluginSettings>): Line[] {
		return textLines.map(line => {
			return this.createLineFromTextLine(line, settings);
		});
	}

	// создаёт объект из одного из классов, кто реализует Line в зависимости от строки.
	static createLineFromTextLine(stringLine: string, settings: Readonly<CheckboxSyncPluginSettings>): Line {
		const checkboxLine = CheckboxLine.createFromLine(stringLine, settings);
		if (checkboxLine) {
			return checkboxLine;
		}
		const listLine = ListLine.createFromLine(stringLine, settings);
		if (listLine) {
			return listLine;
		}

		const textLine = TextLine.createFromLine(stringLine, settings)!;
		return textLine;
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

