import { CheckboxState } from "src/types";
import { CheckboxProcess } from "../interface/CheckboxProcess";
import { Context } from "../model/Context";
import { TreeNode } from "../model/TreeNode";

export class PropagateStateToParentProcess implements CheckboxProcess {

	process(context: Context): void {
		if (!context.getSettings().enableAutomaticParentState) {
			return;
		}
		// получить представление текста
		const view = context.getView();


		const nodes = view.getTreeNodes();

		for (const node of nodes) {
			this.propagateStateFromChildrens(node);
		}
	}

	// возврат значения нужен для того, чтобы правильно обрабатывать случаи с "не чекбоксам", чтобы они передавали значения детей
	propagateStateFromChildrens(node: TreeNode): CheckboxState {
		const line = node.getLine();

		if (!node.hasChildren()) {
			return line.getState();
		}

		let resultIfHasRelevantChildren = CheckboxState.Checked;
		let hasRelevantChildren = false;
		for (const childrenNode of node.getChildrenNodes()) {
			const childrenState = this.propagateStateFromChildrens(childrenNode);

			if (childrenState === CheckboxState.Checked || childrenState === CheckboxState.Unchecked) {
				hasRelevantChildren = true;
			}

			if (childrenState === CheckboxState.Unchecked) {
				resultIfHasRelevantChildren = CheckboxState.Unchecked;
			}
		}
		// делаем эту проверку только после обработки детей
		if (line.getState() == CheckboxState.Ignore) {
			return line.getState();
		}
		// проверка для нод, все дети которых не релевантны
		if (!hasRelevantChildren) {
			return line.getState();
		}

		line.setStateIfNotEquals(resultIfHasRelevantChildren);

		return resultIfHasRelevantChildren;
	}
}
