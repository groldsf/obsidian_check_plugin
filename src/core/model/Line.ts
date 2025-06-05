export interface Line {
  getIndent(): number;

  getText(): string;

  toResultText(): string;

}