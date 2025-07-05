import { CheckboxState } from "src/types";
import { CheckboxProcess } from "../interface/CheckboxProcess";
import { Context } from "../model/Context";
import { TreeNode } from "../model/TreeNode";
import { CheckboxLine } from "../model/line/CheckboxLine";

export class PropagateStateToParentProcess implements CheckboxProcess {

	process(context: Context): void {
		if (!context.getSettings().enableAutomaticParentState) {
			return;
		}
		// получить представление текста
		const view = context.getView();


		const nodes = view.getTreeNodes();

		for (const node of nodes) {
			this.propagateStateToParent(node);
		}
	}

	// возврат значения нужен для того, чтобы правильно обрабатывать случаи с "не чекбоксам", чтобы они передавали значения детей
	propagateStateToParent(node: TreeNode): CheckboxState {
		const line = node.getLine();

		// обходим всех детей
		const childrenStates: CheckboxState[] = [];
		for (const childrenNode of node.getChildrenNodes()) {
			const childrenState = this.propagateStateToParent(childrenNode);
			childrenStates.push(childrenState);
		}

		const newState = this.getNewState(line.getState(), childrenStates);
		
		if (line instanceof CheckboxLine){
			line.setStateIfNotEquals(newState);
		}
		
		return newState;
	}

	getNewState(actualState: CheckboxState, childrenStates: CheckboxState[]): CheckboxState {
		if (actualState === CheckboxState.Ignore) {
			return actualState;
		}

		// обходим всех детей
		// если есть релевантные дети, то помечаем это и обновляем "состояние" Line
		// "состояние" - потому что даже не чекбоксы могут иметь состояние через своих детей
		let resultIfHasRelevantChildren = CheckboxState.Checked;
		let hasRelevantChildren = false;
		for (const childrenState of childrenStates) {
			if (childrenState !== CheckboxState.Ignore && childrenState !== CheckboxState.NoCheckbox) {
				hasRelevantChildren = true;
			}

			if (childrenState === CheckboxState.Unchecked) {
				resultIfHasRelevantChildren = CheckboxState.Unchecked;
			}
		}

		if (hasRelevantChildren) {
			return resultIfHasRelevantChildren;
		} else {
			return actualState;
		}
	}

}
