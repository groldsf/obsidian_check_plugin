import { CheckboxState, CheckboxSyncPluginSettings } from "src/types";
import { AbstractLine } from "./AbstractLine";
import { TEXT_REGEXP } from "src/core/Regexp";

export class TextLine extends AbstractLine {

  
  static createFromLine(textLine: string, settings: Readonly<CheckboxSyncPluginSettings>): TextLine | null {
    const textLineMatch = textLine.match(TEXT_REGEXP);
    if (textLineMatch) {
      const indentString = textLineMatch[1];
      const itemText = textLineMatch[2];
      return new TextLine(indentString, itemText, settings);
    }
    return null;
  }
  toResultText(): string {
    // const spaces = ' '.repeat(this.indent);
    const resultText = this.indentString + this.listText;
    return resultText;
  }

  getState(): CheckboxState {
    return CheckboxState.NoCheckbox;
  }
}