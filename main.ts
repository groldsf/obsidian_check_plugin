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
    let updates: { line: number; ch: number; value: string }[] = [];

    for (let i = lines.length - 1; i >= 0; i--) {
      // Регулярные выражения для всех типов списков (с учетом пробела перед чекбоксом)
      const match = lines[i].match(/^(\s*)([*+-]|\d+\.) \[([ x-])\] /);
      if (!match) continue;

      const indent = match[1].length; // Индентирование
      const isChecked = match[3] === "x"; // Состояние чекбокса
      let allChildrenChecked = true;
      let hasChildren = false;
      let j = i + 1;

      // Ищем вложенные элементы для всех типов списков
      while (j < lines.length) {
        const childMatch = lines[j].match(/^(\s*)([*+-]|\d+\.) \[([ x-])\] /);
        if (!childMatch || childMatch[1].length <= indent) break;
        hasChildren = true;
        if (childMatch[3] !== "x") allChildrenChecked = false;
        j++;
      }

      // Обновляем родительский чекбокс, если есть дочерние
      if (hasChildren) {
        const checkboxPos = match[1].length + match[2].length + 2; // Позиция чекбокса
        if (allChildrenChecked && !isChecked) {
          updates.push({ line: i, ch: checkboxPos, value: "x" });
        } else if (!allChildrenChecked && isChecked) {
          updates.push({ line: i, ch: checkboxPos, value: " " });
        }
      }
    }

    // Применяем изменения через replaceRange()
    if (updates.length > 0) {
      editor.blur();
      updates.forEach(({ line, ch, value }) => {
        editor.replaceRange(value, { line, ch }, { line, ch: ch + 1 });
      });
    }
  }
}
