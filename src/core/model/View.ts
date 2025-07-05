import { TreeNode } from "./TreeNode";

export class View {
	private treeNodes: TreeNode[];
	// метка того, что Единичное изменение произошло в этой View
	private modify: boolean;

	constructor(treeNodes: TreeNode[]) {
		this.treeNodes = treeNodes;
		// проверить ноды на modify
		let isModify = false;
		for (const treeNode of treeNodes) {
			isModify = isModify || treeNode.isModify();
		}
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
