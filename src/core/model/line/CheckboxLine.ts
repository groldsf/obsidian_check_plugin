import { CheckboxState, CheckboxSyncPluginSettings } from "src/types";
import { AbstractLine } from "./AbstractLine";
import { GlobalVars } from "src/GlobalVars";
import { CHECKBOX_REGEXP } from "src/core/Regexp";

export class CheckboxLine extends AbstractLine {

  // символы перед чекбоксом
  private marker: string;
  // символ в чекбоксе
  private checkChar: string;
  // позиция символа чекбокса в исходной строке
  // private checkboxCharPosition: number;
  // интерпретация символа чекбокса(или его отсутствия)
  private checkboxState: CheckboxState;
  // интерпретация состояния чекбокса(или его отсутствия)
  // private isChecked?: boolean | undefined;

  // метка того, что Единичное изменение произошло в этой строке
  private hasChange = false;

  protected settings: Readonly<CheckboxSyncPluginSettings>;

  constructor(indentString: string, marker: string, checkChar: string, listItemText: string, settings: Readonly<CheckboxSyncPluginSettings>) {
    super(indentString, listItemText, settings);
    this.marker = marker;
    this.checkChar = checkChar;
    this.settings = settings;

    // this.checkboxCharPosition = indent + marker.length + 2;
    this.checkboxState = this.getCheckboxState(checkChar);
  }

  static createFromLine(textLine: string, settings: Readonly<CheckboxSyncPluginSettings>): CheckboxLine | null {
    const checkboxMatch = textLine.match(CHECKBOX_REGEXP);
    if (checkboxMatch) {
      const indentString = checkboxMatch[1];
      const marker = checkboxMatch[2];
      const checkChar = checkboxMatch[3];
      const listItemText = checkboxMatch[4].trimStart();
      return new CheckboxLine(indentString, marker, checkChar, listItemText, settings);
    }
    return null;
  }

  isChange(): boolean {
    return this.hasChange;
  }

  setChange(hasChange: boolean) {
    this.hasChange = hasChange;
  }


  private static getNewCheckboxLineFromTasksApi(api: any, checkboxLine: CheckboxLine, targetState: CheckboxState): CheckboxLine | null {
    let line: CheckboxLine | null = checkboxLine;
    const seenChars = new Set<string>();
    seenChars.add(checkboxLine.checkChar);

    while (true) {
      const textLine = line.toResultText();
      const newTextLine = api.executeToggleTaskDoneCommand(textLine, null);
      const newBox = CheckboxLine.createFromLine(newTextLine, line.settings);
      if (!newBox) {
        return null;
      }
      if (newBox.checkboxState === targetState) {
        return newBox;
      }
      if (seenChars.has(newBox.checkChar)) {
        return null;
      }
      
      seenChars.add(newBox.checkChar);
      line = newBox;
    }
  }

  setState(state: CheckboxState): void {
    const taskPlugin = GlobalVars.APP?.plugins.plugins['obsidian-tasks-plugin'];
    if (taskPlugin) {
      const api = taskPlugin.apiV1;
      const res = CheckboxLine.getNewCheckboxLineFromTasksApi(api, this, state);
      if (res !== null) {
        this.listText = res.listText;
      }
    }
    // обновить checkboxState
    this.checkboxState = state;
    // обновить checkChar
    this.checkChar = this.getCharFromState(state);
  }

  setStateIfNotEquals(newState: CheckboxState) {
    if (newState !== this.checkboxState) {
      this.setState(newState);
    }
  }

  getState(): CheckboxState {
    return this.checkboxState;
  }

  toResultText(): string {
    // const spaces = ' '.repeat(this.indent);
    const resultText = this.indentString + this.marker + " [" + this.checkChar + "] " + this.listText;
    return resultText;
  }

  private getCheckboxState(text: string): CheckboxState {
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

  private getCharFromState(state: CheckboxState): string {
    switch (state) {
      case CheckboxState.Checked:
        return this.settings.checkedSymbols.length > 0 ? this.settings.checkedSymbols[0] : 'x'; // 'x' как дефолт
      case CheckboxState.Unchecked:
        return this.settings.uncheckedSymbols.length > 0 ? this.settings.uncheckedSymbols[0] : ' '; // ' ' как дефолт
      case CheckboxState.Ignore:
        if (this.settings.ignoreSymbols.length > 0) {
          return this.settings.ignoreSymbols[0];
        } else {
          throw new Error("Not found ignore char.");
        }
      case CheckboxState.NoCheckbox:
        throw new Error(`Unexpected value for parameter [state] = ${state}. "NoCheckbox".`);
      default:
        throw new Error(`Unexpected value for parameter [state] = ${state}.`);
    }
  }

}