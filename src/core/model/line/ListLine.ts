import { CheckboxState } from "src/types";
import { AbstractLine } from "./AbstractLine";

export class ListLine extends AbstractLine {

  // символы перед текстом
  private marker: string;

  constructor(indentString: string, marker: string, listText: string, tabSize: number) {
    super(indentString, listText, tabSize);
    this.marker = marker;
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