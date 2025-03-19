import { CheckboxUtils } from "../src/checkboxUtils";

describe("CheckboxUtils", () => {
  let checkboxUtilsXOnly: CheckboxUtils;
  let checkboxUtilsSpaceOnly: CheckboxUtils;

  beforeEach(() => {
    checkboxUtilsXOnly = new CheckboxUtils({ xOnlyMode: true });
    checkboxUtilsSpaceOnly = new CheckboxUtils({ xOnlyMode: false });
  });

  describe("findCheckboxesLine", () => {
    test("recognizes valid checkbox lines", () => {
      expect(checkboxUtilsXOnly.findCheckboxesLine("- [ ] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine(" - [ ] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("- [x] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("* [ ] Another task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("+ [x] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("1. [ ] Numbered task")).not.toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("1. [x] Numbered task")).not.toBeNull();
    });

    test("correctly handles different checkbox states", () => {
      const states = [" ", "x", "-", "?", "!", "*", "#", "@", "[", "]", "y", "X", "Y"];
      
      for (const state of states) {
        const match = checkboxUtilsXOnly.findCheckboxesLine(`- [${state}] Task`);
        expect(match).not.toBeNull();
        expect(match![3]).toBe(state);
      }
    });

    test("correctly handles indentation", () => {
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

    test("ignores invalid lines", () => {
      expect(checkboxUtilsXOnly.findCheckboxesLine("-[ ] Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("*[x] Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("1.[ ] Numbered task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("- [] Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("  - Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("Just some text")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("1. Some numbered task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("")).toBeNull();
    });

    test("ignores lines with missing opening or closing brackets", () => {
      // Missing opening bracket [
      expect(checkboxUtilsXOnly.findCheckboxesLine("- ] Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("* ] Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("+ ] Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("1. ] Task")).toBeNull();
      
      // Missing closing bracket ]
      expect(checkboxUtilsXOnly.findCheckboxesLine("- [x Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("* [ Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("+ [- Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("1. [? Task")).toBeNull();
      
      // Malformed with spaces
      expect(checkboxUtilsXOnly.findCheckboxesLine("- [ x Task")).toBeNull();
      expect(checkboxUtilsXOnly.findCheckboxesLine("- x] Task")).toBeNull();
    });

    test("extracts list marker correctly", () => {
      const dashMatch = checkboxUtilsXOnly.findCheckboxesLine("- [ ] Task");
      expect(dashMatch).not.toBeNull();
      expect(dashMatch![2]).toBe("-");

      const asteriskMatch = checkboxUtilsXOnly.findCheckboxesLine("* [ ] Task");
      expect(asteriskMatch).not.toBeNull();
      expect(asteriskMatch![2]).toBe("*");

      const plusMatch = checkboxUtilsXOnly.findCheckboxesLine("+ [ ] Task");
      expect(plusMatch).not.toBeNull();
      expect(plusMatch![2]).toBe("+");

      const numberedMatch = checkboxUtilsXOnly.findCheckboxesLine("1. [ ] Task");
      expect(numberedMatch).not.toBeNull();
      expect(numberedMatch![2]).toBe("1.");
    });
  });

  describe("isCheckedSymbol", () => {
    test("in xOnlyMode only 'x' is considered checked", () => {
      expect(checkboxUtilsXOnly.isCheckedSymbol("x")).toBe(true);
      expect(checkboxUtilsXOnly.isCheckedSymbol(" ")).toBe(false);
      expect(checkboxUtilsXOnly.isCheckedSymbol("-")).toBe(false);
      expect(checkboxUtilsXOnly.isCheckedSymbol("?")).toBe(false);
    });

    test("in normal mode all symbols except space are considered checked", () => {
      expect(checkboxUtilsSpaceOnly.isCheckedSymbol("x")).toBe(true);
      expect(checkboxUtilsSpaceOnly.isCheckedSymbol(" ")).toBe(false);
      expect(checkboxUtilsSpaceOnly.isCheckedSymbol("-")).toBe(true);
      expect(checkboxUtilsSpaceOnly.isCheckedSymbol("?")).toBe(true);
    });

    test("handles uppercase 'X' correctly", () => {
      expect(checkboxUtilsXOnly.isCheckedSymbol("X")).toBe(false);
      expect(checkboxUtilsSpaceOnly.isCheckedSymbol("X")).toBe(true);
    });
  });

  describe("updateSettings", () => {
    test("updates xOnlyMode setting correctly", () => {
      const utils = new CheckboxUtils({ xOnlyMode: true });
      expect(utils.isCheckedSymbol("-")).toBe(false);
      
      utils.updateSettings({ xOnlyMode: false });
      expect(utils.isCheckedSymbol("-")).toBe(true);
      
      utils.updateSettings({ xOnlyMode: true });
      expect(utils.isCheckedSymbol("-")).toBe(false);
    });
  });

  describe("syncCheckboxes", () => {
    test("updates parent checkbox if all children are checked (xOnlyMode)", () => {
      const text = "- [ ] Parent\n  - [x] Child 1\n  - [x] Child 2";
      const expected = "- [x] Parent\n  - [x] Child 1\n  - [x] Child 2";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual(expected);
    });

    test("updates parent checkbox if all children are checked (spaceOnly)", () => {
      const text = "- [ ] Parent\n  - [?] Child 1\n  - [-] Child 2";
      const expected = "- [x] Parent\n  - [?] Child 1\n  - [-] Child 2";
      expect(checkboxUtilsSpaceOnly.syncCheckboxes(text)).toEqual(expected);
    });

    test("unchecks parent if not all children are checked", () => {
      const text = "- [x] Parent\n  - [x] Child 1\n  - [ ] Child 2";
      const expected = "- [ ] Parent\n  - [x] Child 1\n  - [ ] Child 2";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual(expected);
    });

    test("doesn't change parent if it has no children", () => {
      const text = "- [x] Single";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual(text);
    });

    test("handles multiple levels of nesting correctly", () => {
      const text = "- [ ] Parent\n  - [ ] Child\n    - [x] Grandchild";
      const expected = "- [x] Parent\n  - [x] Child\n    - [x] Grandchild";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual(expected);
    });

    test("handles mixed indentation levels correctly", () => {
      const text = "- [ ] Parent\n  - [x] Child 1\n    - [x] Grandchild 1\n  - [x] Child 2";
      const expected = "- [x] Parent\n  - [x] Child 1\n    - [x] Grandchild 1\n  - [x] Child 2";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual(expected);
    });

    test("handles siblings with different indentation correctly", () => {
      const text = "- [ ] Parent\n  - [x] Child 1\n    - [x] Grandchild 1\n  - [ ] Child 2";
      const expected = "- [ ] Parent\n  - [x] Child 1\n    - [x] Grandchild 1\n  - [ ] Child 2";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual(expected);
    });

    test("handles multiple parents correctly", () => {
      const text = "- [ ] Parent 1\n  - [x] Child 1\n- [ ] Parent 2\n  - [x] Child 2";
      const expected = "- [x] Parent 1\n  - [x] Child 1\n- [x] Parent 2\n  - [x] Child 2";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual(expected);
    });

    test("handles mixed content with non-checkbox lines correctly", () => {
      const text = "- [ ] Parent\nSome regular text\n  - [x] Child 1\nMore text\n  - [x] Child 2";
      const expected = "- [ ] Parent\nSome regular text\n  - [x] Child 1\nMore text\n  - [x] Child 2";
      expect(checkboxUtilsXOnly.syncCheckboxes(text)).toEqual(expected);
    });
  });
});
