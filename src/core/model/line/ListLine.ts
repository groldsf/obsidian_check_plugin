import { AbstractLine } from "./AbstractLine";

export class ListLine extends AbstractLine {

  // символы перед текстом
  private marker: string;

  constructor(indent: number, marker: string, listText: string) {
    super(indent, listText);
    this.marker = marker;
  }

  getMarker(): string {
    return this.marker;
  }

  setMarker(marker: string) {
    this.marker = marker;
  }

  toResultText(): string {
    const spaces = ' '.repeat(this.indent);

    const resultText = spaces + this.marker + " " + this.listText;
    return resultText;
  }
}