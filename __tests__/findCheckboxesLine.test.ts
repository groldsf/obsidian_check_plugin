import { CheckboxUtils } from "../src/checkboxUtils";

describe("CheckboxUtils old", () => {
  let checkboxUtilsXOnly: CheckboxUtils;
  let checkboxUtilsSpaceOnly: CheckboxUtils;

  beforeEach(() => {
    checkboxUtilsXOnly = new CheckboxUtils({ xOnlyMode: true });
    checkboxUtilsSpaceOnly = new CheckboxUtils({ xOnlyMode: false });
  });

  describe("findCheckboxesLine", () => {
    test("recognizes valid checkbox lines", () => {
      expect(checkboxUtilsXOnly.matchCheckboxLine("- [ ] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine(" - [ ] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("- [x] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("* [ ] Another task")).not.toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("+ [x] Task")).not.toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("1. [ ] Numbered task")).not.toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("1. [x] Numbered task")).not.toBeNull();
    });

    test("correctly handles different checkbox states", () => {
      const states = [" ", "x", "-", "?", "!", "*", "#", "@", "[", "]", "y", "X", "Y"];
      
      for (const state of states) {
        const lineInfo = checkboxUtilsXOnly.matchCheckboxLine(`- [${state}] Task`);
        expect(lineInfo).not.toBeNull();
        expect(lineInfo?.checkChar).toBe(state);
      }
    });

    test("correctly handles indentation", () => {
      const noIndentMatch = checkboxUtilsXOnly.matchCheckboxLine("- [ ] Task");
      expect(noIndentMatch).not.toBeNull();
      expect(noIndentMatch!.indent).toBe("".length);

      const singleSpaceMatch = checkboxUtilsXOnly.matchCheckboxLine(" - [ ] Task");
      expect(singleSpaceMatch).not.toBeNull();
      expect(singleSpaceMatch!.indent).toBe(" ".length);

      const multiSpaceMatch = checkboxUtilsXOnly.matchCheckboxLine("    - [ ] Task");
      expect(multiSpaceMatch).not.toBeNull();
      expect(multiSpaceMatch!.indent).toBe("    ".length);

      const tabMatch = checkboxUtilsXOnly.matchCheckboxLine("\t- [ ] Task");
      expect(tabMatch).not.toBeNull();
      expect(tabMatch!.indent).toBe("\t".length);
    });

    test("ignores invalid lines", () => {
      expect(checkboxUtilsXOnly.matchCheckboxLine("-[ ] Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("*[x] Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("1.[ ] Numbered task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("- [] Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("  - Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("Just some text")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("1. Some numbered task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("")).toBeNull();
    });

    test("ignores lines with missing opening or closing brackets", () => {
      // Missing opening bracket [
      expect(checkboxUtilsXOnly.matchCheckboxLine("- ] Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("* ] Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("+ ] Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("1. ] Task")).toBeNull();
      
      // Missing closing bracket ]
      expect(checkboxUtilsXOnly.matchCheckboxLine("- [x Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("* [ Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("+ [- Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("1. [? Task")).toBeNull();
      
      // Malformed with spaces
      expect(checkboxUtilsXOnly.matchCheckboxLine("- [ x Task")).toBeNull();
      expect(checkboxUtilsXOnly.matchCheckboxLine("- x] Task")).toBeNull();
    });

    test("extracts list marker correctly", () => {
      const dashMatch = checkboxUtilsXOnly.matchCheckboxLine("- [ ] Task");
      expect(dashMatch).not.toBeNull();
      expect(dashMatch!.marker).toBe("-");

      const asteriskMatch = checkboxUtilsXOnly.matchCheckboxLine("* [ ] Task");
      expect(asteriskMatch).not.toBeNull();
      expect(asteriskMatch!.marker).toBe("*");

      const plusMatch = checkboxUtilsXOnly.matchCheckboxLine("+ [ ] Task");
      expect(plusMatch).not.toBeNull();
      expect(plusMatch!.marker).toBe("+");

      const numberedMatch = checkboxUtilsXOnly.matchCheckboxLine("1. [ ] Task");
      expect(numberedMatch).not.toBeNull();
      expect(numberedMatch!.marker).toBe("1.");
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

      const settings = { xOnlyMode: true };
      const utils = new CheckboxUtils(settings);
      expect(utils.isCheckedSymbol("-")).toBe(false);
      
      settings.xOnlyMode = false;
      expect(utils.isCheckedSymbol("-")).toBe(true);
      
      settings.xOnlyMode = true;
      expect(utils.isCheckedSymbol("-")).toBe(false);
    });
  });

  describe("syncCheckboxes", () => {
    test("updates parent checkbox if all children are checked (xOnlyMode)", () => {
      const text = "- [ ] Parent\n  - [x] Child 1\n  - [x] Child 2";
      const expected = "- [x] Parent\n  - [x] Child 1\n  - [x] Child 2";
      expect(checkboxUtilsXOnly.propagateStateFromChildren(text)).toEqual(expected);
    });

    test("updates parent checkbox if all children are checked (spaceOnly)", () => {
      const text = "- [ ] Parent\n  - [?] Child 1\n  - [-] Child 2";
      const expected = "- [x] Parent\n  - [?] Child 1\n  - [-] Child 2";
      expect(checkboxUtilsSpaceOnly.propagateStateFromChildren(text)).toEqual(expected);
    });

    test("unchecks parent if not all children are checked", () => {
      const text = "- [x] Parent\n  - [x] Child 1\n  - [ ] Child 2";
      const expected = "- [ ] Parent\n  - [x] Child 1\n  - [ ] Child 2";
      expect(checkboxUtilsXOnly.propagateStateFromChildren(text)).toEqual(expected);
    });

    test("doesn't change parent if it has no children", () => {
      const text = "- [x] Single";
      expect(checkboxUtilsXOnly.propagateStateFromChildren(text)).toEqual(text);
    });

    test("handles multiple levels of nesting correctly", () => {
      const text = "- [ ] Parent\n  - [ ] Child\n    - [x] Grandchild";
      const expected = "- [x] Parent\n  - [x] Child\n    - [x] Grandchild";
      expect(checkboxUtilsXOnly.propagateStateFromChildren(text)).toEqual(expected);
    });

    test("handles mixed indentation levels correctly", () => {
      const text = "- [ ] Parent\n  - [x] Child 1\n    - [x] Grandchild 1\n  - [x] Child 2";
      const expected = "- [x] Parent\n  - [x] Child 1\n    - [x] Grandchild 1\n  - [x] Child 2";
      expect(checkboxUtilsXOnly.propagateStateFromChildren(text)).toEqual(expected);
    });

    test("handles siblings with different indentation correctly", () => {
      const text = "- [ ] Parent\n  - [x] Child 1\n    - [x] Grandchild 1\n  - [ ] Child 2";
      const expected = "- [ ] Parent\n  - [x] Child 1\n    - [x] Grandchild 1\n  - [ ] Child 2";
      expect(checkboxUtilsXOnly.propagateStateFromChildren(text)).toEqual(expected);
    });

    test("handles multiple parents correctly", () => {
      const text = "- [ ] Parent 1\n  - [x] Child 1\n- [ ] Parent 2\n  - [x] Child 2";
      const expected = "- [x] Parent 1\n  - [x] Child 1\n- [x] Parent 2\n  - [x] Child 2";
      expect(checkboxUtilsXOnly.propagateStateFromChildren(text)).toEqual(expected);
    });

    test("handles mixed content with non-checkbox lines correctly", () => {
      const text = "- [ ] Parent\nSome regular text\n  - [x] Child 1\nMore text\n  - [x] Child 2";
      const expected = "- [ ] Parent\nSome regular text\n  - [x] Child 1\nMore text\n  - [x] Child 2";
      expect(checkboxUtilsXOnly.propagateStateFromChildren(text)).toEqual(expected);
    });
  });
});
