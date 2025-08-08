import { TreeNode } from "./TreeNode";

export class View {
	private treeNodes: TreeNode[];
	// метка того, что Единичное изменение произошло в этой View
	private changeNode: TreeNode | null;

	constructor(treeNodes: TreeNode[], changeNode: TreeNode | null) {
		this.treeNodes = treeNodes;
		this.changeNode = changeNode;
	}

	isModify(): boolean {
		return this.changeNode ? true : false;
	}

	getChangeNode(): TreeNode | null {
		return this.changeNode;
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
