import { CheckboxState } from "src/types";
import { AbstractLine } from "./AbstractLine";

export class TextLine extends AbstractLine {
  toResultText(): string {
    // const spaces = ' '.repeat(this.indent);
    const resultText = this.indentString + this.listText;
    return resultText;
  }

  getState(): CheckboxState {
    return CheckboxState.NoCheckbox;
  }
}