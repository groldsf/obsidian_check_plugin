import { CheckboxState, CheckboxSyncPluginSettings } from "src/types";
import { AbstractLine } from "./AbstractLine";

export class CheckboxLine extends AbstractLine {
  
  // символы перед чекбоксом
  private marker: string;
  // символ в чекбоксе
  private checkChar: string;
  // позиция символа чекбокса в исходной строке
  private checkboxCharPosition: number;
  // интерпретация символа чекбокса(или его отсутствия)
  private checkboxState: CheckboxState;
  // интерпретация состояния чекбокса(или его отсутствия)
  // private isChecked?: boolean | undefined;
  

  private hasChange = false;  

  protected settings: Readonly<CheckboxSyncPluginSettings>;

  constructor(indent: number, marker: string, checkChar: string, lineText: string, settings: Readonly<CheckboxSyncPluginSettings>) {
    super(indent, lineText);
    this.marker = marker;
    this.checkChar = checkChar;
    this.settings = settings;

    this.checkboxCharPosition = ;
    this.checkboxState = ;
    throw new Error("Constructor not implemented.");
  }

  isChange(): boolean {
    return this.hasChange;
  }

  setChange(hasChange: boolean) {
    this.hasChange = hasChange;
  }

  

  isCheckbox(): boolean {
    return this.checkboxState !== CheckboxState.NoCheckbox;
  }

  setState(state: CheckboxState): void {
    // обновить checkboxState
    this.checkboxState = state;
    // обновить checkChar
    switch (state) {
      case CheckboxState.Checked:
        this.checkChar = this.settings.checkedSymbols.length > 0 ? this.settings.checkedSymbols[0] : 'x'; // 'x' как дефолт
        break;
      case CheckboxState.Unchecked:
        this.checkChar = this.settings.uncheckedSymbols.length > 0 ? this.settings.uncheckedSymbols[0] : ' '; // ' ' как дефолт
        break;
      case CheckboxState.Ignore:
        if (this.settings.ignoreSymbols.length > 0) {
          this.checkChar = this.settings.ignoreSymbols[0];
        } else {
          throw new Error("Not found ignore char.");
        }
        break;
      case CheckboxState.NoCheckbox:
        this.checkChar = undefined;
        break;
      default:
        throw new Error(`Unexpected value for parameter [state] = ${state}.`);
    }
  }

  setStateIfNotEquals(newState: CheckboxState) {
    if (newState !== this.checkboxState) {
      this.setState(newState);
    }
  }

  getState(): CheckboxState {
    return this.checkboxState;
  }

  
}