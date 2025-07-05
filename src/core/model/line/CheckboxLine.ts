import { CheckboxState, CheckboxSyncPluginSettings } from "src/types";
import { AbstractLine } from "./AbstractLine";

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

  constructor(indentString:string, marker: string, checkChar: string, listItemText: string, settings: Readonly<CheckboxSyncPluginSettings>) {
    super(indentString, listItemText, settings.tabSize);
    this.marker = marker;
    this.checkChar = checkChar;
    this.settings = settings;

    // this.checkboxCharPosition = indent + marker.length + 2;
    this.checkboxState = this.getCheckboxState(checkChar);
  }

  isChange(): boolean {
    return this.hasChange;
  }

  setChange(hasChange: boolean) {
    this.hasChange = hasChange;
  }


  setState(state: CheckboxState): void {
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