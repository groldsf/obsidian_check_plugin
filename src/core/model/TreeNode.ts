import { Line } from "./Line";

export class TreeNode {
	private parent?: TreeNode;
	private childrens: TreeNode[];

	private line: Line;
	private modify = false;

	constructor(line: Line) {
		this.line = line;
		if (line.isChange()) {
			this.modify = true;
		}
	}

	getLine(): Line {
		return this.line;
	}

	isModify(): boolean {
		return this.modify;
	}

	private setParent(parent: TreeNode) {
		this.parent = parent;
	}

	getParent(): TreeNode | undefined {
		return this.parent;
	}

	addChildren(children: TreeNode) {
		this.childrens.push(children);
		children.setParent(this);

		this.modify = this.modify || children.isModify();
	}

	hasChildren(): boolean {
		return this.childrens.length > 0;
	}

	getChildrenNodes(): TreeNode[] {
		return [...this.childrens];
	}

	toResultText(): string {
		const parts: string[] = [];

		parts.push(this.line.toResultText());

		for (const children of this.childrens) {
			parts.push(children.toResultText());
		}
		
		return parts.join("\n");
	}
}
