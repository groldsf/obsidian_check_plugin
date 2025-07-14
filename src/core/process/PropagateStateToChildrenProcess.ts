import { CheckboxState } from "src/types";
import { CheckboxProcess } from "../interface/CheckboxProcess";
import { Context } from "../model/Context";
import { TreeNode } from "../model/TreeNode";
import { CheckboxLine } from "../model/line/CheckboxLine";

export class PropagateStateToChildrenProcess implements CheckboxProcess {

	process(context: Context): void {
		if (!context.getSettings().enableAutomaticChildState) {
			return;
		}
		if (!context.textBeforeChangeIsPresent()) {
			console.log("PropagateStateToChildrenProcess: textBeforeChange is not present");
			return;
		}
		// получить представление текста
		const view = context.getView();

		if (!view.isModify()) {
			console.log("PropagateStateToChildrenProcess: not modify");
			return;
		}
		const changeNode = view.getChangeNode()!;
		this.propagateStateToChildrenFromNode(changeNode);

	}

	propagateStateToChildrenFromNode(modifiedNode: TreeNode) {
		const line = modifiedNode.getLine();
		if (!(line instanceof CheckboxLine)) {
			console.warn(`propagateStateToChildren from !CheckboxLine.`);
			return;
		}
		const state = line.getState();
		if (state === CheckboxState.Ignore || state === CheckboxState.NoCheckbox) {
			console.warn(`propagateStateToChildren from uncorrect state: ${state.toString()}`);
			return;
		}
		this.propagateStateToChildren(modifiedNode, state);
	}

	propagateStateToChildren(node: TreeNode, state: CheckboxState) {
		const line = node.getLine();
		if (line instanceof CheckboxLine) {
			line.setStateIfNotEquals(state);
		}
		for (const childrenNode of node.getChildrenNodes()) {
			this.propagateStateToChildren(childrenNode, state);
		}
	}
}
