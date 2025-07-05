import { CheckboxSyncPluginSettings } from "src/types";
import { ICheckboxUtils } from "./interface/ICheckboxUtils";
import { ContextFactory } from "./model/ContextFactory";
import { PropagateStateToChildrenProcess } from "./process/PropagateStateToChildrenProcess";
import { PropagateStateToParentProcess } from "./process/PropagateStateToParentProcess";

export class CheckboxUtils2 implements ICheckboxUtils {
	private settings: Readonly<CheckboxSyncPluginSettings>;
	private propagateStateToChildrenProcess: PropagateStateToChildrenProcess;
	private propagateStateToParentProcess: PropagateStateToParentProcess;

	constructor(settings: Readonly<CheckboxSyncPluginSettings>) {
		this.settings = settings;
		this.propagateStateToChildrenProcess = new PropagateStateToChildrenProcess();
		this.propagateStateToParentProcess = new PropagateStateToParentProcess();
	}

	syncText(text: string, textBefore: string | undefined): string {
		if (text === textBefore) {
			return text;
		}
		const context = ContextFactory.createContext(text, textBefore, this.settings);

		this.propagateStateToChildrenProcess.process(context);
		this.propagateStateToParentProcess.process(context);

		return context.getResultText();
	}
}
