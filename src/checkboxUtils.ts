import { CheckboxSyncPluginSettings } from "./types";

export class CheckboxUtils {
  constructor(private settings: CheckboxSyncPluginSettings) { }

  updateSettings(settings: CheckboxSyncPluginSettings) {
    this.settings = settings;
  }

  findCheckboxesLine(line: string): RegExpMatchArray | null {
    return line.match(/^(\s*)([*+-]|\d+\.) \[(.)\]\s/);
  }

  isCheckedSymbol(text: string): boolean {
    return this.settings.xOnlyMode ? text === "x" : text !== " ";
  }

  syncCheckboxes(text: string): string{
    const lines = text.split("\n");

    for (let i = lines.length - 1; i >= 0; i--) {
      const match = this.findCheckboxesLine(lines[i]);
      if (!match) continue;

      const indent = match[1].length;
      const isChecked = this.isCheckedSymbol(match[3]);
      let allChildrenChecked = true;
      let hasChildren = false;
      let j = i + 1;

      while (j < lines.length) {
        const childMatch = this.findCheckboxesLine(lines[j]);
        if (!childMatch || childMatch[1].length <= indent) break;
        hasChildren = true;
        const childrenIsChecked = this.isCheckedSymbol(childMatch[3]);
        if (!childrenIsChecked) {
          allChildrenChecked = false;
          break;
        }
        j++;
      }

      if (hasChildren) {
        const checkboxPos = match[1].length + match[2].length + 2;
        if (allChildrenChecked && !isChecked) {
          lines[i] = lines[i].substring(0, checkboxPos) + "x" + lines[i].substring(checkboxPos + 1);
        } else if (!allChildrenChecked && isChecked) {
          lines[i] = lines[i].substring(0, checkboxPos) + " " + lines[i].substring(checkboxPos + 1);
        }
      }
    }
    return lines.join("\n");
  }
}