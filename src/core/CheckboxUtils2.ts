import { CheckboxState, CheckboxSyncPluginSettings } from "src/types";
import { ICheckboxUtils } from "./interface/ICheckboxUtils";
import { ContextFactory } from "./model/ContextFactory";
import { PropagateStateToChildrenProcess } from "./process/PropagateStateToChildrenProcess";
import { PropagateStateToParentProcess } from "./process/PropagateStateToParentProcess";

export interface CheckboxLineInfo {
	indent: number;
	marker: string;
	checkChar?: string;
	checkboxCharPosition?: number;
	checkboxState: CheckboxState;
	isChecked?: boolean | undefined;
	listItemText?: string;
}

export class CheckboxUtils2 implements ICheckboxUtils {
	private settings: Readonly<CheckboxSyncPluginSettings>;
	private propagateStateToChildrenProcces: PropagateStateToChildrenProcess;
	private propagateStateToParentProcces: PropagateStateToParentProcess;

	constructor(settings: Readonly<CheckboxSyncPluginSettings>) {
		this.settings = settings;
	}

	syncText(text: string, textBefore: string | undefined): string {
		if (text === textBefore) {
			return text;
		}
		const context = ContextFactory.createContext(text, textBefore, this.settings);

		this.propagateStateToChildrenProcces.process(context);
		this.propagateStateToParentProcces.process(context);

		return context.getResultText();
	}
}
