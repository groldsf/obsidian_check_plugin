/**
 * Функция для поиска строк с чекбоксами в формате Markdown.
 */
export function findCheckboxesLine(line: string): RegExpMatchArray | null {
    return line.match(/^(\s*)([*+-]|\d+\.) \[([ x-])\] /);
  }
  
  /**
   * Возвращает список изменений (позиции и новые значения), но не модифицирует текст напрямую.
   */
  export function syncCheckboxes(text: string): { line: number; ch: number; value: string }[] {
    const lines = text.split("\n");
    let updates: { line: number; ch: number; value: string }[] = [];
  
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = findCheckboxesLine(lines[i]);
      if (!match) continue;
  
      const indent = match[1].length;
      const isChecked = match[3] === "x";
      let allChildrenChecked = true;
      let hasChildren = false;
      let j = i + 1;
  
      while (j < lines.length) {
        const childMatch = findCheckboxesLine(lines[j]);
        if (!childMatch || childMatch[1].length <= indent) break;
        hasChildren = true;
        if (childMatch[3] !== "x") allChildrenChecked = false;
        j++;
      }
  
      if (hasChildren) {
        const checkboxPos = match[1].length + match[2].length + 2;
        if (allChildrenChecked && !isChecked) {
          updates.push({ line: i, ch: checkboxPos, value: "x" });
        } else if (!allChildrenChecked && isChecked) {
          updates.push({ line: i, ch: checkboxPos, value: " " });
        }
      }
    }
  
    return updates;
  }