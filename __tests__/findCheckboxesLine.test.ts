import { findCheckboxesLine, syncCheckboxes } from "../src/checkboxUtils";

describe("findCheckboxesLine", () => {
  test("распознаёт корректные строки с чекбоксами", () => {
    expect(findCheckboxesLine("- [ ] Task")).not.toBeNull();
    expect(findCheckboxesLine(" - [ ] Task")).not.toBeNull();
    expect(findCheckboxesLine("- [x] Task")).not.toBeNull();
    expect(findCheckboxesLine("* [ ] Another task")).not.toBeNull();
    expect(findCheckboxesLine("+ [x] Task")).not.toBeNull();
    expect(findCheckboxesLine("1. [ ] Numbered task")).not.toBeNull();
    expect(findCheckboxesLine("1. [x] Numbered task")).not.toBeNull();
  });

  test("игнорирует некорректные строки", () => {
    // Отсутствует пробел после маркера списка
    expect(findCheckboxesLine("-[ ] Task")).toBeNull();
    expect(findCheckboxesLine("*[x] Task")).toBeNull();
    expect(findCheckboxesLine("1.[ ] Numbered task")).toBeNull();
    // Неверное содержимое скобок или неверный регистр
    expect(findCheckboxesLine("- [] Task")).toBeNull();
    expect(findCheckboxesLine("- [X] Task")).toBeNull();
    // Не соответствует шаблону чекбокса
    expect(findCheckboxesLine("  - Task")).toBeNull();
    expect(findCheckboxesLine("Just some text")).toBeNull();
    expect(findCheckboxesLine("1. Some numbered task")).toBeNull();
  });
});

describe("syncCheckboxes", () => {
  test("обновляет родительский чекбокс, если все дочерние отмечены", () => {
    const text = "- [ ] Parent\n  - [x] Child 1\n  - [x] Child 2";
    // Для строки "- [ ] Parent":
    // match[1] = "" (нулевой отступ), match[2] = "-" (1 символ) 
    // => позиция чекбокса = 0 + 1 + 2 = 3
    expect(syncCheckboxes(text)).toEqual([{ line: 0, ch: 3, value: "x" }]);
  });

  test("снимает отметку у родителя, если не все дочерние отмечены", () => {
    const text = "- [x] Parent\n  - [x] Child 1\n  - [ ] Child 2";
    // Родительский чекбокс должен стать незамеченным, то есть "x" -> " "
    expect(syncCheckboxes(text)).toEqual([{ line: 0, ch: 3, value: " " }]);
  });

  test("не изменяет родителя, если у него нет дочерних элементов", () => {
    const text = "- [x] Single";
    expect(syncCheckboxes(text)).toEqual([]);
  });

  test("тройная вложенность: обновляет только промежуточный уровень", () => {
    const text = "- [ ] Parent\n  - [ ] Child\n    - [x] Grandchild";
    // Для строки "  - [ ] Child":
    // match[1] = "  " (2 пробела), match[2] = "-" (1 символ)
    // => позиция чекбокса = 2 + 1 + 2 = 5
    expect(syncCheckboxes(text)).toEqual([{ line: 1, ch: 5, value: "x" }]);
  });

  test("тройная вложенность: обновляет родительский чекбокс, если все вложенные отмечены", () => {
    const text = "- [ ] Parent\n  - [x] Child\n    - [x] Grandchild";
    // Здесь для строки "  - [x] Child" изменений не требуется (она уже отмечена).
    // Родительский элемент имеет единственного дочернего, отмеченного как [x],
    // поэтому ожидается обновление строки Parent: позиция = 0 + 1 + 2 = 3.
    expect(syncCheckboxes(text)).toEqual([{ line: 0, ch: 3, value: "x" }]);
  });
});
