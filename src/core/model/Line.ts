import { CheckboxState } from "src/types";

export interface Line {
  getIndent(): number;

  getText(): string;

  toResultText(): string;

  getState(): CheckboxState;

}