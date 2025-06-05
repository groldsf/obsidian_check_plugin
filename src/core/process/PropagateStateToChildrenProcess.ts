import { CheckboxState } from "src/types";
import { CheckboxProcess } from "../interface/CheckboxProcess";
import { Context } from "../model/Context";
import { TreeNode } from "../model/TreeNode";

export class PropagateStateToChildrenProcess implements CheckboxProcess {

	process(context: Context): void {
		if (!context.getSettings().enableAutomaticChildState) {
			return;
		}
		if (!context.textBeforeChangeIsPresent()) {
			return;
		}
		// получить представление текста
		const view = context.getView();

		if (!view.isModify()) {
			return;
		}

		const nodes = view.getTreeNodes();
		for (const node of nodes) {
			this.propageteStateToChildrenFromChangeLineNode(node);
		}
	}

	// находит изменённую Line, если она существует и вызывает от неё propagateStateToChildren
	propageteStateToChildrenFromChangeLineNode(node: TreeNode) {
		if (!node.isModify()) {
			return;
		}
		const line = node.getLine();
		// если line изменён
		if (line.isChange()) {
			// значит мы нашли нужную ноду
			this.propagateStateToChildren(node);
		} else {
			// иначе ищем вглубь среди детей
			const childrens = node.getChildrenNodes();
			for (const children of childrens) {
				this.propageteStateToChildrenFromChangeLineNode(children);
			}
		}
	}


	propagateStateToChildren(modifiedNode: TreeNode) {
		const state = modifiedNode.getLine().getState();
		if (state === CheckboxState.Ignore || state === CheckboxState.NoCheckbox) {
			console.warn(`propagateStateToChildren ${state.toString()}`);
			return;
		}
		this.propagateToChildren(modifiedNode, state);
	}

	propagateToChildren(node: TreeNode, state: CheckboxState) {
		const line = node.getLine();
		if (line.isCheckbox()) {
			line.setStateIfNotEquals(state);
		}
		for (const childrenNode of node.getChildrenNodes()) {
			this.propagateToChildren(childrenNode, state);
		}
	}
}
