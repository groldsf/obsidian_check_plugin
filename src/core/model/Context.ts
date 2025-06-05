import { CheckboxSyncPluginSettings } from "src/types";
import { View } from "./View";
import { Line } from "./Line";
import { ContextFactory } from "./ContextFactory";

export class Context {

	private settings: Readonly<CheckboxSyncPluginSettings>;

	private text: string;
	private textLines?: string[];

	private textBeforeChange?: string;
	private textBeforeChangeLines?: string[];

	private lines?: Line[];
	private view?: View;
	
	constructor(text: string, textBeforeChange: string | undefined, settings: Readonly<CheckboxSyncPluginSettings>) {
		this.text = text;
		this.textBeforeChange = textBeforeChange;
		this.settings = settings;
	}

	getSettings(): Readonly<CheckboxSyncPluginSettings> {
		return this.settings;
	}

	textBeforeChangeIsPresent(): boolean {
		if (this.textBeforeChange) {
			return true;
		}
		return false;
	}

	getText() {
		return this.text;
	}

	getTextLines() {
		if (!this.textLines) {
			this.textLines = this.getText().split("\n");
		}
		return this.textLines;
	}

	getTextBeforeChange() {
		return this.textBeforeChange;
	}

	getTextBeforeChangeLines() {
		if (!this.textBeforeChangeLines) {
			this.textBeforeChangeLines = this.textBeforeChange?.split("\n");
		}
		return this.textBeforeChangeLines;
	}

	getLines() {
		if (!this.lines) {
			this.lines = ContextFactory.createLines(this);
		}
		return this.lines;
	}

	getView(): View {
		if (!this.view) {
			this.view = ContextFactory.createView(this);
		}
		return this.view;
	}

	getResultText(): string {
		return this.getView().toResultText();
	}
}
