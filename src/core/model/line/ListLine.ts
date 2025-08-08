import { CheckboxState, CheckboxSyncPluginSettings } from "src/types";
import { AbstractLine } from "./AbstractLine";
import { LIST_ITEM_REGEXP } from "src/core/Regexp";

export class ListLine extends AbstractLine {

  // символы перед текстом
  private marker: string;

  constructor(indentString: string, marker: string, listText: string, settings: Readonly<CheckboxSyncPluginSettings>) {
    super(indentString, listText, settings);
    this.marker = marker;
  }

  static createFromLine(textLine: string, settings: Readonly<CheckboxSyncPluginSettings>): ListLine | null {
    const listItemMatch = textLine.match(LIST_ITEM_REGEXP);
    if (listItemMatch) {
      const indentString = listItemMatch[1];
      const marker = listItemMatch[2];
      const listItemText = listItemMatch[3].trimStart();
      return new ListLine(indentString, marker, listItemText, settings);
    }
    return null;
  }

  getMarker(): string {
    return this.marker;
  }

  setMarker(marker: string) {
    this.marker = marker;
  }

  toResultText(): string {
    // const spaces = ' '.repeat(this.indent);
    const resultText = this.indentString + this.marker + " " + this.listText;
    return resultText;
  }

  getState(): CheckboxState {
    return CheckboxState.NoCheckbox;
  }
}