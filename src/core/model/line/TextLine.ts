import { AbstractLine } from "./AbstractLine";

export class TextLine extends AbstractLine {
  toResultText(): string {
    const spaces = ' '.repeat(this.indent);
    const resultText = spaces + this.listText;
    return resultText;
  }
}