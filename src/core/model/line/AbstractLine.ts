import { CheckboxState, CheckboxSyncPluginSettings } from "src/types";
import { Line } from "../Line";

export abstract class AbstractLine implements Line {

  protected indentString: string;
  protected tabSize: number;
  // длина отступа
  protected indent: number;
  // текст после чекбокса
  protected listText: string;

  constructor(indentString: string, lineText: string, settings: Readonly<CheckboxSyncPluginSettings>) {
    this.indentString = indentString;
    this.listText = lineText;
    this.tabSize = settings.tabSize;

    this.indent = this.getIndentFromString(indentString, this.tabSize);
  }

  private getIndentFromString(indentString: string, tabSize: number): number {    
    let indent = 0;
    for (const char of indentString) {
      if (char === '\t') {
        indent += tabSize;
      } else if (char === ' ') {
        indent += 1;
      }
    }
    return indent;
  }

  getIndent(): number {
    return this.indent;
  }

  getText(): string {
    return this.listText;
  }

  abstract toResultText(): string;

  abstract getState(): CheckboxState;
}