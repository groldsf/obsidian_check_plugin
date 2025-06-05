import { TreeNode } from "./TreeNode";

export class View {
	private treeNodes: TreeNode[];
	private modify: boolean;

	constructor(treeNodes: TreeNode[], isModify: boolean) {
		this.treeNodes = treeNodes;
		this.modify = isModify;
	}

	isModify() {
		return this.modify;
	}

	getTreeNodes(): TreeNode[] {
		return this.treeNodes;
	}

	toResultText(): string {
		const parts: string[] = [];
		for (const treeNode of this.treeNodes) {
			parts.push(treeNode.toResultText());
		}
		return parts.join("\n");
	}
}
