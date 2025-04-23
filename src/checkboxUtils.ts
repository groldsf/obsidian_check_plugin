import { CheckboxState, CheckboxSyncPluginSettings } from "./types";

export interface CheckboxLineInfo {
  indent: number;
  marker: string;
  checkChar: string;
  checkboxCharPosition: number;
  checkboxState: CheckboxState;
  isChecked: boolean | undefined;
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
    const checkboxState = this.getCheckboxState(checkChar);
    let isChecked = checkboxState === CheckboxState.Ignore ? undefined : checkboxState === CheckboxState.Checked;

    return {
      indent,
      marker,
      checkChar,
      checkboxCharPosition,
      checkboxState,
      isChecked
    };
  }

  getCheckboxState(text: string): CheckboxState {
    if (this.settings.checkedSymbols.includes(text)) {
      return CheckboxState.Checked;
    }
    if (this.settings.uncheckedSymbols.includes(text)) {
      return CheckboxState.Unchecked;
    }
    if (this.settings.ignoreSymbols.includes(text)) {
      return CheckboxState.Ignore;
    }
    return this.settings.unknownSymbolPolicy;
  }

  updateLineCheckboxStateWithInfo(line: string, shouldBeChecked: boolean, lineInfo: CheckboxLineInfo): string {
    const checkedChar = this.settings.checkedSymbols.length > 0 ? this.settings.checkedSymbols[0] : 'x'; // 'x' как дефолт
    const uncheckedChar = this.settings.uncheckedSymbols.length > 0 ? this.settings.uncheckedSymbols[0] : ' '; // ' ' как дефолт

    const newCheckChar = shouldBeChecked ? checkedChar : uncheckedChar;
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
      console.warn(`checkbox not found in line ${parentLine}`)
      return text;
    }

    if (parentLineInfo.checkboxState === CheckboxState.Ignore) {
      return text;
    }
    let parentIsChecked = parentLineInfo.isChecked!;

    let j = parentLine + 1;

    while (j < lines.length) {
      const childText = lines[j];
      const childLineInfo = this.matchCheckboxLine(childText);
      if (!childLineInfo || childLineInfo.indent <= parentLineInfo.indent) break;

      if (childLineInfo.checkboxState !== CheckboxState.Ignore) {
        lines[j] = this.updateLineCheckboxStateWithInfo(lines[j], parentIsChecked, childLineInfo);
        j++;
      } else {
        //skip children ignore node
        j++;
        while (j < lines.length) {
          const subChildLineInfo = this.matchCheckboxLine(lines[j]);
          if (!subChildLineInfo || subChildLineInfo.indent <= childLineInfo.indent) {
            break;
          };
          j++;
        }
      }
    }
    return lines.join("\n");
  }

  propagateStateFromChildren(text: string): string {
    const lines = text.split("\n");

    for (let i = lines.length - 1; i >= 0; i--) {
      const parentLineInfo = this.matchCheckboxLine(lines[i]);
      if (!parentLineInfo) continue;

      if (parentLineInfo.checkboxState === CheckboxState.Ignore) {
        continue;
      }
      const parentIsChecked = parentLineInfo.isChecked!;
      let allChildrenChecked = true;
      let hasChildren = false;

      for (let j = i + 1; j < lines.length; j++) {
        const childLineInfo = this.matchCheckboxLine(lines[j]);
        if (!childLineInfo) {
          continue;
        }
        if (childLineInfo.indent <= parentLineInfo.indent) break;

        if (childLineInfo.checkboxState === CheckboxState.Ignore) {
          while (j + 1 < lines.length) {
            const subChildLineInfo = this.matchCheckboxLine(lines[j + 1]);
            if (!subChildLineInfo || subChildLineInfo.indent <= childLineInfo.indent) {
              break;
            };
            j++;
          }
          continue;
        }
        hasChildren = true;
        const childrenIsChecked = childLineInfo.isChecked!;
        if (!childrenIsChecked) {
          allChildrenChecked = false;
          break;
        }
      }

      if (hasChildren && parentIsChecked !== allChildrenChecked) {
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
      lineInfoBefore.checkboxState !== lineInfoAfter.checkboxState
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