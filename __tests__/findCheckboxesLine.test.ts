import { CheckboxUtils } from "../src/checkboxUtils";

describe("CheckboxUtils", () => {
  let checkboxUtilsXOnly: CheckboxUtils;
  let checkboxUtilsSpaceOnly: CheckboxUtils;

  beforeEach(() => {
    checkboxUtilsXOnly = new CheckboxUtils({ xOnlyMode: true });
    checkboxUtilsSpaceOnly = new CheckboxUtils({ xOnlyMode: false });
  });

  describe("findCheckboxesLine", () => {
    test("распознаёт корректные строки с чекбоксами", () => {
      expect(checkboxUtilsXOnly.findCheckboxesLine("- [ ] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine(" - [ ] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("- [x] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("* [ ] Another task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("+ [x] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("1. [ ] Numbered task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("1. [x] Numbered task")).not.toBeNull();
    });

    test("корректно обрабатывает разные состояния чекбокса", () => {
      const states = [" ", "x", "-", "?", "!", "*", "#", "@", "[", "]", "y", "X", "Y"];
      
      for (const state of states) {
        const match = checkboxUtilsXOnly.findCheckboxesLine(`- [${state}] Task`);
        expect(match).not.toBeNull();
        expect(match![3]).toBe(state);
      }
    });

    test("корректно обрабатывает отступы", () => {
      const noIndentMatch = checkboxUtilsXOnly.findCheckboxesLine("- [ ] Task");
      expect(noIndentMatch).not.toBeNull();
      expect(noIndentMatch![1]).toBe("");

      const singleSpaceMatch = checkboxUtilsXOnly.findCheckboxesLine(" - [ ] Task");
      expect(singleSpaceMatch).not.toBeNull();
      expect(singleSpaceMatch![1]).toBe(" ");

      const multiSpaceMatch = checkboxUtilsXOnly.findCheckboxesLine("    - [ ] Task");
      expect(multiSpaceMatch).not.toBeNull();
      expect(multiSpaceMatch![1]).toBe("    ");

      const tabMatch = checkboxUtilsXOnly.findCheckboxesLine("\t- [ ] Task");
      expect(tabMatch).not.toBeNull();
      expect(tabMatch![1]).toBe("\t");
    });

    test("игнорирует некорректные строки", () => {
      expect(checkboxUtilsXOnly.findCheckboxesLine("-[ ] Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("*[x] Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("1.[ ] Numbered task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("- [] Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("  - Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("Just some text")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("1. Some numbered task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("")).toBeNull();
    });
  });

  describe("isCheckedSymbol", () => {
    test("в режиме xOnlyMode только 'x' считается отмеченным", () => {
      expect(checkboxUtilsXOnly.isCheckedSymbol("x")).toBe(true);
      expect(checkboxUtilsXOnly.isCheckedSymbol(" ")).toBe(false);
      expect(checkboxUtilsXOnly.isCheckedSymbol("-")).toBe(false);
      expect(checkboxUtilsXOnly.isCheckedSymbol("?")).toBe(false);
    });

    test("в обычном режиме все символы кроме пробела считаются отмеченными", () => {
      expect(checkboxUtilsSpaceOnly.isCheckedSymbol("x")).toBe(true);
      expect(checkboxUtilsSpaceOnly.isCheckedSymbol(" ")).toBe(false);
      expect(checkboxUtilsSpaceOnly.isCheckedSymbol("-")).toBe(true);
      expect(checkboxUtilsSpaceOnly.isCheckedSymbol("?")).toBe(true);
    });
  });

  describe("syncCheckboxes", () => {
    test("обновляет родительский чекбокс, если все дочерние отмечены (xOnlyMode)", () => {
      const text = "- [ ] Parent\n  - [x] Child 1\n  - [x] Child 2";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual([{ line: 0, ch: 3, value: "x" }]);
    });

    test("обновляет родительский чекбокс, если все дочерние отмечены (spaceOnly)", () => {
      const text = "- [ ] Parent\n  - [?] Child 1\n  - [-] Child 2";
      expect(checkboxUtilsSpaceOnly.syncCheckboxes(text)).toEqual([{ line: 0, ch: 3, value: "x" }]);
    });

    test("снимает отметку у родителя, если не все дочерние отмечены", () => {
      const text = "- [x] Parent\n  - [x] Child 1\n  - [ ] Child 2";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual([{ line: 0, ch: 3, value: " " }]);
    });

    test("не изменяет родителя, если у него нет дочерних элементов", () => {
      const text = "- [x] Single";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual([]);
    });

    test("тройная вложенность: обновляет только промежуточный уровень", () => {
      const text = "- [ ] Parent\n  - [ ] Child\n    - [x] Grandchild";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual([{ line: 1, ch: 5, value: "x" }]);
    });

    test("тройная вложенность: обновляет родительский чекбокс, если все вложенные отмечены", () => {
      const text = "- [ ] Parent\n  - [x] Child\n    - [x] Grandchild";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual([{ line: 0, ch: 3, value: "x" }]);
    });
  });
});
