import { Plugin, Editor } from "obsidian";

export default class CheckboxSyncPlugin extends Plugin {
  async onload() {
    this.registerEvent(
      this.app.workspace.on("editor-change", (editor) => {
        this.updateParentCheckboxes(editor);
      })
    );
  }

  updateParentCheckboxes(editor: Editor) {
    const lines = editor.getValue().split("\n");
    const scrollInfo = editor.getScrollInfo();
    const cursor = editor.getCursor();
    let updates: { line: number; ch: number; value: string }[] = [];

    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(/^(\s*)- \[(.)\] /);
      if (!match) continue;

      const indent = match[1].length;
      const isChecked = match[2] === "x";
      let allChildrenChecked = true;
      let hasChildren = false;
      let j = i + 1;

      while (j < lines.length) {
        const childMatch = lines[j].match(/^(\s*)- \[(.)\] /);
        if (!childMatch || childMatch[1].length <= indent) break;
        hasChildren = true;
        if (childMatch[2] !== "x") allChildrenChecked = false;
        j++;
      }

      if (hasChildren) {
        const checkboxPos = match[1].length + 3; // позиция "x" или " " в строке
        if (allChildrenChecked && !isChecked) {
          updates.push({ line: i, ch: checkboxPos, value: "x" });
        } else if (!allChildrenChecked && isChecked) {
          updates.push({ line: i, ch: checkboxPos, value: " " });
        }
      }
    }

    // Если есть изменения, используем transaction()
    if (updates.length > 0) {
      // Создаем объект транзакции для применения изменений
      const transaction = {
        changes: updates.map(({ line, ch, value }) => ({
          from: { line, ch },
          to: { line, ch: ch + 1 },
          text: value, // Используем 'text' вместо 'insert'
        })),
      };
      editor.blur();
      editor.setCursor(updates[0].line, updates[0].ch)
      // Применяем изменения в транзакции
      editor.transaction(transaction);      
    }
  }
}
