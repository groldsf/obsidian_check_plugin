import { CheckboxSyncPluginSettings } from "./types";

export interface CheckboxLineInfo {
  indent: number;
  marker: string;
  checkChar: string;
  checkboxCharPosition: number;
}

export class CheckboxUtils {
  private settings: Readonly<CheckboxSyncPluginSettings>;
  constructor(settings: Readonly<CheckboxSyncPluginSettings>) {
    this.settings = settings;
  }

  matchCheckboxLine(line: string): CheckboxLineInfo | null {
    const match = line.match(/^(\s*)([*+-]|\d+\.) \[(.)\]\s/);
    if (!match) {
      return null;
    }
    const indent = match[1].length;
    const marker = match[2];
    const checkChar = match[3];
    const checkboxCharPosition = indent + marker.length + 2;

    return {
      indent,
      marker,
      checkChar,
      checkboxCharPosition
    };
  }

  isCheckedSymbol(text: string): boolean {
    return this.settings.xOnlyMode ? text === "x" : text !== " ";
  }

  updateLineCheckboxStateWithInfo(line: string, shouldBeChecked: boolean, lineInfo: CheckboxLineInfo): string {
    const newCheckChar = shouldBeChecked ? "x" : " ";
    const pos = lineInfo.checkboxCharPosition;
    if (pos >= 0 && pos < line.length) {
      return line.substring(0, pos) + newCheckChar + line.substring(pos + 1);
    }
    console.warn("updateLineCheckboxStateWithInfo: Invalid checkbox position in lineInfo for line:", line);
    return line;
  }

  propagateStateToChildren(text: string, parentLine: number): string {
    // console.log("propagateStateToChildren");

    const lines = text.split("\n");

    const parentLineInfo = this.matchCheckboxLine(lines[parentLine]);
    if (!parentLineInfo) {
      console.log(`checkbox not found in line ${parentLine}`)
      return text;
    }

    const isChecked = this.isCheckedSymbol(parentLineInfo.checkChar);
    let j = parentLine + 1;

    while (j < lines.length) {
      const childLineInfo = this.matchCheckboxLine(lines[j]);
      if (!childLineInfo || childLineInfo.indent <= parentLineInfo.indent) break;
      lines[j] = this.updateLineCheckboxStateWithInfo(lines[j], isChecked, childLineInfo);
      j++;
    }
    return lines.join("\n");
  }

  propagateStateFromChildren(text: string): string {
    const lines = text.split("\n");

    for (let i = lines.length - 1; i >= 0; i--) {
      const parentLineInfo = this.matchCheckboxLine(lines[i]);
      if (!parentLineInfo) continue;

      const isChecked = this.isCheckedSymbol(parentLineInfo.checkChar);
      let allChildrenChecked = true;
      let hasChildren = false;
      let j = i + 1;

      while (j < lines.length) {
        const childLineInfo = this.matchCheckboxLine(lines[j]);
        if (!childLineInfo || childLineInfo.indent <= parentLineInfo.indent) break;
        hasChildren = true;
        const childrenIsChecked = this.isCheckedSymbol(childLineInfo.checkChar);
        if (!childrenIsChecked) {
          allChildrenChecked = false;
          break;
        }
        j++;
      }

      if (hasChildren && isChecked !== allChildrenChecked) {
        lines[i] = this.updateLineCheckboxStateWithInfo(lines[i], allChildrenChecked, parentLineInfo);
      }
    }
    return lines.join("\n");
  }

  syncText(text: string, textBefore: string | undefined): string {
    let newText = text;
    if (this.settings.enableAutomaticChildState) {
      newText = this.propagateStateToChildrenFromSingleDiff(text, textBefore);
    }
    if (this.settings.enableAutomaticParentState) {
      newText = this.propagateStateFromChildren(newText);
    }
    return newText;
  }

  propagateStateToChildrenFromSingleDiff(text: string, textBefore: string | undefined): string {
    if (!textBefore) return text;
    const textBeforeLines = textBefore.split('\n');
    const textLines = text.split('\n');

    if (textBeforeLines.length !== textLines.length) return text;

    const diffIndexes = this.findDifferentLineIndexes(textBeforeLines, textLines);
    if (diffIndexes.length !== 1) {
      return text;
    }

    const index = diffIndexes[0];

    const lineBefore = textBeforeLines[index];
    const lineAfter = textLines[index];
    // Получаем информацию о чекбоксе ДО и ПОСЛЕ изменения
    const lineInfoBefore = this.matchCheckboxLine(lineBefore);
    const lineInfoAfter = this.matchCheckboxLine(lineAfter);
    // Проверяем, что:
    // 1. Обе строки (до и после) являются валидными строками с чекбоксом.
    // 2. Отступ и маркер списка не изменились (т.е. структура строки та же).
    // 3. Изменился именно символ внутри скобок [ ].
    if (
      lineInfoBefore && lineInfoAfter &&
      lineInfoBefore.indent === lineInfoAfter.indent &&
      lineInfoBefore.marker === lineInfoAfter.marker &&
      lineInfoBefore.checkChar !== lineInfoAfter.checkChar
    ) {
      return this.propagateStateToChildren(text, diffIndexes[0]);
    }
    return text;

  }

  findDifferentLineIndexes(lines1: string[], lines2: string[]): number[] {
    if (lines1.length !== lines2.length) {
      throw new Error("the length of the lines must be equal");
    }

    const length = lines1.length;
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      if (lines1[i] !== lines2[i]) {
        result.push(i);
      }
    }
    return result;
  }

}