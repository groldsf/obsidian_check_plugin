// checkboxUtils.test.ts
import { CheckboxUtils } from '../src/checkboxUtils';
import { CheckboxSyncPluginSettings } from '../src/types'; // Предполагаем, что типы в types.ts

// --- Mock Settings ---
const defaultSettings: Readonly<CheckboxSyncPluginSettings> = {
  xOnlyMode: false, // По умолчанию: любой не-пробел считается 'checked'
  enableAutomaticParentState: true,
  enableAutomaticChildState: true,
};

const xOnlySettings: Readonly<CheckboxSyncPluginSettings> = {
  xOnlyMode: true, // Только 'x' считается 'checked'
  enableAutomaticParentState: true,
  enableAutomaticChildState: true,
};

const settingsParentSyncDisabled: Readonly<CheckboxSyncPluginSettings> = {
  xOnlyMode: false, // или true, если нужно тестировать комбинацию
  enableAutomaticParentState: false, // Родитель НЕ обновляется от детей
  enableAutomaticChildState: true,
};

const settingsChildSyncDisabled: Readonly<CheckboxSyncPluginSettings> = {
  xOnlyMode: false,
  enableAutomaticParentState: true, // Оставим true для этого варианта
  enableAutomaticChildState: false, // Дети НЕ обновляются от родителя
};

// --- Test Suite ---
describe('CheckboxUtils', () => {
  let utilsDefault: CheckboxUtils;
  let utilsXOnly: CheckboxUtils;
  let utilsParentSyncDisabled: CheckboxUtils;
  let utilsChildSyncDisabled: CheckboxUtils

  beforeEach(() => {
    // Создаем новые экземпляры перед каждым тестом для изоляции
    utilsDefault = new CheckboxUtils(defaultSettings);
    utilsXOnly = new CheckboxUtils(xOnlySettings);
    utilsParentSyncDisabled = new CheckboxUtils(settingsParentSyncDisabled);
    utilsChildSyncDisabled = new CheckboxUtils(settingsChildSyncDisabled);
  });

  // --- matchCheckboxLine ---
  describe('matchCheckboxLine', () => {
    it.each([
      // Простые случаи
      ['- [ ] Text', { indent: 0, marker: '-', checkChar: ' ', checkboxCharPosition: 3 }],
      ['* [x] Task', { indent: 0, marker: '*', checkChar: 'x', checkboxCharPosition: 3 }],
      ['+ [?] Query', { indent: 0, marker: '+', checkChar: '?', checkboxCharPosition: 3 }],
      ['1. [!] Num', { indent: 0, marker: '1.', checkChar: '!', checkboxCharPosition: 4 }],
      // С отступами
      ['  - [ ] Indented', { indent: 2, marker: '-', checkChar: ' ', checkboxCharPosition: 5 }],
      ['\t* [x] Tab Indent', { indent: 1, marker: '*', checkChar: 'x', checkboxCharPosition: 4 }], // Зависит от размера таба, Jest может считать его 1
      ['    10. [A] Deep', { indent: 4, marker: '10.', checkChar: 'A', checkboxCharPosition: 9 }],
    ])('should match valid checkbox line: %s', (line, expected) => {
      const result = utilsDefault.matchCheckboxLine(line);
      expect(result).toEqual(expected);
    });

    it.each([
      'Not a list item',
      '- Just text',
      '-[] No space',
      '- [No Char]',
      '- [ ]', // Нет пробела после скобки, как требует регекс \s
      '  Non-checkbox line',
      '-[ ] No space before marker',
      '1.[ ] No space after numbered marker',
      '- ] Missing opening bracket',
      '* [x Missing closing bracket',
    ])('should return null for invalid lines: %s', (line) => {
      expect(utilsDefault.matchCheckboxLine(line)).toBeNull();
    });

    it('should require a space after the closing bracket', () => {
      expect(utilsDefault.matchCheckboxLine('- [ ]')).toBeNull(); // Missing trailing space
      expect(utilsDefault.matchCheckboxLine('- [ ] ')).not.toBeNull(); // Has trailing space
    });

    it.each([' ', 'x', '-', '?', '!'])('should correctly parse the checkChar', (state) => {
      const lineInfo = utilsDefault.matchCheckboxLine(`- [${state}] Task`);
      expect(lineInfo).not.toBeNull();
      expect(lineInfo?.checkChar).toBe(state);
    });
  });

  // --- isCheckedSymbol ---
  describe('isCheckedSymbol', () => {
    // Default mode (xOnlyMode: false)
    it('should check symbols correctly in default mode', () => {
      expect(utilsDefault.isCheckedSymbol('x')).toBe(true);
      expect(utilsDefault.isCheckedSymbol('X')).toBe(true);
      expect(utilsDefault.isCheckedSymbol('/')).toBe(true);
      expect(utilsDefault.isCheckedSymbol('-')).toBe(true);
      expect(utilsDefault.isCheckedSymbol('?')).toBe(true);
      expect(utilsDefault.isCheckedSymbol(' ')).toBe(false); // Только пробел - не отмечено
    });

    // xOnly mode (xOnlyMode: true)
    it('should check symbols correctly in xOnly mode', () => {
      expect(utilsXOnly.isCheckedSymbol('x')).toBe(true); // Только 'x' - отмечено
      expect(utilsXOnly.isCheckedSymbol('X')).toBe(false);
      expect(utilsXOnly.isCheckedSymbol('/')).toBe(false);
      expect(utilsXOnly.isCheckedSymbol('-')).toBe(false);
      expect(utilsXOnly.isCheckedSymbol('?')).toBe(false);
      expect(utilsXOnly.isCheckedSymbol(' ')).toBe(false);
    });
  });

  // --- updateLineCheckboxStateWithInfo ---
  describe('updateLineCheckboxStateWithInfo', () => {

    it('should check an unchecked box', () => {
      const uncheckedLine = '  - [ ] Task';
      const uncheckedLineInfo = utilsDefault.matchCheckboxLine(uncheckedLine)!;
      const updatedLine = utilsDefault.updateLineCheckboxStateWithInfo(uncheckedLine, true, uncheckedLineInfo);
      expect(updatedLine).toBe('  - [x] Task');
    });

    it('should uncheck a checked box', () => {
      const checkedLine = '  - [x] Task';
      const checkedLineInfo = utilsDefault.matchCheckboxLine(checkedLine)!;
      const updatedLine = utilsDefault.updateLineCheckboxStateWithInfo(checkedLine, false, checkedLineInfo);
      expect(updatedLine).toBe('  - [ ] Task');
    });

    it('should handle other initial check chars', () => {
      const otherLine = '  - [?] Task';
      const otherLineInfo = utilsDefault.matchCheckboxLine(otherLine)!;
      expect(utilsDefault.updateLineCheckboxStateWithInfo(otherLine, true, otherLineInfo)).toBe('  - [x] Task');
      expect(utilsDefault.updateLineCheckboxStateWithInfo(otherLine, false, otherLineInfo)).toBe('  - [ ] Task');
    });

    it('should return original line if position is invalid (and warn)', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { }); // Подавить вывод в консоль
      const uncheckedLine = '  - [ ] Task';
      const uncheckedLineInfo = utilsDefault.matchCheckboxLine(uncheckedLine)!;
      const invalidInfo = { ...uncheckedLineInfo, checkboxCharPosition: 100 };
      const result = utilsDefault.updateLineCheckboxStateWithInfo(uncheckedLine, true, invalidInfo);
      expect(result).toBe(uncheckedLine);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // --- propagateStateToChildren ---
  describe('propagateStateToChildren', () => {
    const text = [
      '- [ ] Parent 1', // 0
      '  - [ ] Child 1.1', // 1
      '  - [x] Child 1.2', // 2
      '    - [ ] Grandchild 1.2.1', // 3
      '- [x] Parent 2', // 4
      '  - [x] Child 2.1', // 5
    ].join('\n');

    it('should check children when parent is checked', () => {
      // Имитируем проверку Parent 1 (индекс 0)
      const lines = text.split('\n');
      lines[0] = '- [x] Parent 1'; // Manually check parent for the test input
      const initialTextModified = lines.join('\n');

      const result = utilsDefault.propagateStateToChildren(initialTextModified, 0);
      const expected = [
        '- [x] Parent 1', // Checked
        '  - [x] Child 1.1', // Updated
        '  - [x] Child 1.2', // Updated
        '    - [x] Grandchild 1.2.1', // Updated
        '- [x] Parent 2', // Unchanged
        '  - [x] Child 2.1', // Unchanged
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should uncheck children when parent is unchecked', () => {
      // Имитируем снятие отметки с Parent 2 (индекс 4)
      const lines = text.split('\n');
      lines[4] = '- [ ] Parent 2'; // Manually uncheck parent for the test input
      const initialTextModified = lines.join('\n');

      const result = utilsDefault.propagateStateToChildren(initialTextModified, 4);
      const expected = [
        '- [ ] Parent 1', // Unchanged
        '  - [ ] Child 1.1', // Unchanged
        '  - [x] Child 1.2', // Unchanged
        '    - [ ] Grandchild 1.2.1', // Unchanged
        '- [ ] Parent 2', // Unchecked
        '  - [ ] Child 2.1', // Updated
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should do nothing if the target line is not a checkbox', () => {
      const textWithNonCheckbox = [
        '# Header',
        '- [ ] Item 1'
      ].join('\n');
      const result = utilsDefault.propagateStateToChildren(textWithNonCheckbox, 0);
      expect(result).toBe(textWithNonCheckbox);
    });

    it('should stop only when indent is less than or equal to the original parent', () => {
      const textSibling = [
        '- [ ] Parent',       // 0, indent 0
        '  - [ ] Child 1',    // 1, indent 2
        '  - [ ] Sibling C1', // 2, indent 2 (still > 0)
        '- [ ] Parent 2'      // 3, indent 0 (<= 0, stop here)
      ].join('\n');
      const lines = textSibling.split('\n');
      lines[0] = '- [x] Parent'; // Make parent checked
      const modifiedText = lines.join('\n');
      const result = utilsDefault.propagateStateToChildren(modifiedText, 0);
      const expected = [
        '- [x] Parent',
        '  - [x] Child 1',    // Changed (indent 2 > 0)
        '  - [x] Sibling C1', // <<-- ALSO Changed (indent 2 > 0)
        '- [ ] Parent 2'      // Unchanged (indent 0 <= 0)
      ].join('\n');
      expect(result).toBe(expected); // Проверяем обновленное ожидание
    });
  });

  // --- propagateStateFromChildren ---
  describe('propagateStateFromChildren', () => {
    it('should check parent if all children are checked', () => {
      const text = [
        '- [ ] Parent', // Should become [x]
        '  - [x] Child 1',
        '  - [x] Child 2',
        '    - [x] Grandchild 2.1', // Needs to be checked too
      ].join('\n');
      const result = utilsDefault.propagateStateFromChildren(text);
      const expected = [
        '- [x] Parent', // Updated
        '  - [x] Child 1',
        '  - [x] Child 2',
        '    - [x] Grandchild 2.1',
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should uncheck parent if any child is unchecked', () => {
      const text = [
        '- [x] Parent', // Should become [ ]
        '  - [x] Child 1',
        '  - [ ] Child 2', // This one makes parent unchecked
      ].join('\n');
      const result = utilsDefault.propagateStateFromChildren(text);
      const expected = [
        '- [ ] Parent', // Updated
        '  - [x] Child 1',
        '  - [ ] Child 2',
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should handle nested propagation', () => {
      const text = [
        '- [ ] Grandparent', // Should become [ ]
        '  - [x] Parent 1', // Should become [ ]
        '    - [x] Child 1.1',
        '    - [ ] Child 1.2', // Makes Parent 1 unchecked
        '  - [x] Parent 2', // Stays checked
        '    - [x] Child 2.1',
      ].join('\n');
      const result = utilsDefault.propagateStateFromChildren(text);
      const expected = [
        '- [ ] Grandparent', // Updated (because Parent 1 is now [ ])
        '  - [ ] Parent 1', // Updated
        '    - [x] Child 1.1',
        '    - [ ] Child 1.2',
        '  - [x] Parent 2',
        '    - [x] Child 2.1',
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should not change parent state if it has no children', () => {
      const text = [
        '- [ ] Parent No Children',
        '- [x] Parent No Children Checked',
        '  Some other line',
      ].join('\n');
      const result = utilsDefault.propagateStateFromChildren(text);
      expect(result).toBe(text); // No changes expected
    });

    it('should work correctly with xOnlyMode', () => {
      const text = [
        '- [ ] Parent', // Should become [x] in xOnly mode
        '  - [x] Child 1',
        '  - [x] Child 2'
      ].join('\n');
      const result = utilsXOnly.propagateStateFromChildren(text);
      expect(result).toContain('- [x] Parent'); // Parent checked

      const text2 = [
        '- [x] Parent', // Should become [ ] because '?' is not 'x'
        '  - [x] Child 1',
        '  - [?] Child 2'
      ].join('\n');
      const result2 = utilsXOnly.propagateStateFromChildren(text2);
      expect(result2).toContain('- [ ] Parent'); // Parent unchecked
    });

    it('should handle multiple independent parent checklists', () => {
      const text = [
        '- [ ] Parent 1',
        '  - [x] Child 1.1',
        'Some other text',
        '* [ ] Parent 2',
        '  * [x] Child 2.1',
        '  * [x] Child 2.2',
      ].join('\n');
      const result = utilsDefault.propagateStateFromChildren(text);
      const expected = [
        '- [x] Parent 1', // Updated
        '  - [x] Child 1.1',
        'Some other text',
        '* [x] Parent 2', // Updated
        '  * [x] Child 2.1',
        '  * [x] Child 2.2',
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should stop searching for children for a parent when a line with equal or lesser indent is encountered', () => {
      const text = [
        '- [ ] Parent 1',          // indent 0
        'Some regular text',       // indent 0. Stops search for Parent 1 children HERE.
        '  - [x] Child 1.1',       // indent 2. Ignored for Parent 1 because search stopped.
        '- [ ] Parent 2',          // indent 0. Processed independently later.
        '  - [x] Child 2.1',       // indent 2. Child of Parent 2.
      ].join('\n');

      const result = utilsDefault.propagateStateFromChildren(text);

      // Ожидания:
      // - Parent 1 не найдет детей (из-за "Some regular text") и останется [ ].
      // - Parent 2 найдет Child 2.1 ([x]) и станет [x].
      const expected = [
        '- [ ] Parent 1',          // Unchanged
        'Some regular text',       // Unchanged
        '  - [x] Child 1.1',       // Unchanged
        '- [x] Parent 2',          // Updated because Child 2.1 is checked
        '  - [x] Child 2.1',       // Unchanged
      ].join('\n');

      expect(result).toBe(expected);
    });

    it('should stop searching for children when a sibling checkbox is encountered', () => {
      const text = [
        '- [ ] Parent 1',          // indent 0
        '- [ ] Sibling Parent',    // indent 0. Stops search for Parent 1 children HERE.
        '  - [x] Child 1.1',       // indent 2. Belongs to Sibling Parent if processed.
      ].join('\n');

      const result = utilsDefault.propagateStateFromChildren(text);

      // Ожидания:
      // - Parent 1 не найдет детей (из-за "Sibling Parent") и останется [ ].
      // - Sibling Parent найдет Child 1.1 ([x]) и станет [x].
      const expected = [
        '- [ ] Parent 1',          // Unchanged
        '- [x] Sibling Parent',    // Updated because Child 1.1 is checked
        '  - [x] Child 1.1',       // Unchanged
      ].join('\n');

      expect(result).toBe(expected);
    });

  });

  // --- propagateStateToChildrenFromSingleDiff ---
  describe('propagateStateToChildrenFromSingleDiff', () => {
    const textBefore = [
      '- [ ] Parent', // 0
      '  - [ ] Child', // 1
    ].join('\n');

    it('should propagate down if single line changed and it was a checkbox toggle', () => {
      const textAfter = [
        '- [x] Parent', // Changed state
        '  - [ ] Child',
      ].join('\n');
      const result = utilsDefault.propagateStateToChildrenFromSingleDiff(textAfter, textBefore);
      const expected = [ // Expect children to be updated
        '- [x] Parent',
        '  - [x] Child',
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should NOT propagate down if single line changed but it was NOT checkbox state', () => {
      const textAfter = [
        '- [ ] Parent Edited Text', // Text changed, not checkbox
        '  - [ ] Child',
      ].join('\n');
      const result = utilsDefault.propagateStateToChildrenFromSingleDiff(textAfter, textBefore);
      // Expect original textAfter, no downward propagation
      expect(result).toBe(textAfter);
    });

    it('should NOT propagate down if single line changed into non-checkbox', () => {
      const textAfter = [
        'Parent removed checkbox', // Structure changed
        '  - [ ] Child',
      ].join('\n');
      const result = utilsDefault.propagateStateToChildrenFromSingleDiff(textAfter, textBefore);
      expect(result).toBe(textAfter);
    });


    it('should NOT propagate down if multiple lines changed', () => {
      const textAfter = [
        '- [x] Parent', // Changed
        '  - [x] Child', // Changed
      ].join('\n');
      const result = utilsDefault.propagateStateToChildrenFromSingleDiff(textAfter, textBefore);
      expect(result).toBe(textAfter); // Expect original textAfter
    });

    it('should NOT propagate down if line counts differ', () => {
      const textAfter = [
        '- [x] Parent',
        '  - [ ] Child',
        '  - [ ] New Child',
      ].join('\n');
      const result = utilsDefault.propagateStateToChildrenFromSingleDiff(textAfter, textBefore);
      expect(result).toBe(textAfter); // Expect original textAfter
    });

    it('should NOT propagate down if textBefore is undefined', () => {
      const textAfter = [
        '- [x] Parent',
        '  - [ ] Child',
      ].join('\n');
      const result = utilsDefault.propagateStateToChildrenFromSingleDiff(textAfter, undefined);
      expect(result).toBe(textAfter); // Expect original textAfter
    });
  });

  // --- findDifferentLineIndexes ---
  describe('findDifferentLineIndexes', () => {
    const lines1 = ['a', 'b', 'c'];

    it('should return empty array for identical lines', () => {
      const lines2 = ['a', 'b', 'c'];
      expect(utilsDefault.findDifferentLineIndexes(lines1, lines2)).toEqual([]);
    });

    it('should return index of the single different line', () => {
      const lines2 = ['a', 'B', 'c'];
      expect(utilsDefault.findDifferentLineIndexes(lines1, lines2)).toEqual([1]);
    });

    it('should return indexes of multiple different lines', () => {
      const lines2 = ['A', 'b', 'C'];
      expect(utilsDefault.findDifferentLineIndexes(lines1, lines2)).toEqual([0, 2]);
    });

    it('should throw error if line lengths are different', () => {
      const lines2 = ['a', 'b'];
      expect(() => utilsDefault.findDifferentLineIndexes(lines1, lines2)).toThrow(
        'the length of the lines must be equal'
      );
    });
  });


  // --- syncText (Integration) ---
  describe('syncText', () => {
    describe('When user changes parent state directly', () => {
      const textBefore = [
          '- [ ] Parent',
          '  - [ ] Child 1',
          '  - [ ] Child 2',
        ].join('\n');
        const textAfterUserCheck = [
          '- [x] Parent', // User checked this
          '  - [ ] Child 1',
          '  - [ ] Child 2',
        ].join('\n');

      it('should propagate down when child sync is ENABLED', () => { 
        const result = utilsDefault.syncText(textAfterUserCheck, textBefore);
        const expected = [
          '- [x] Parent',
          '  - [x] Child 1', // Propagated down
          '  - [x] Child 2', // Propagated down
        ].join('\n');
        expect(result).toBe(expected);
      });

      it('should NOT propagate down when child sync is DISABLED', () => {
        const result = utilsChildSyncDisabled.syncText(textAfterUserCheck, textBefore); 
        const expected = [ // Ожидаем, что дети НЕ изменились
          '- [ ] Parent', // propagateStateFromChildren
          '  - [ ] Child 1',
          '  - [ ] Child 2',
        ].join('\n');
        expect(result).toBe(expected);
      });

      const textBeforeUncheck = [
          '- [x] Parent',
          '  - [x] Child 1',
          '  - [x] Child 2',
      ].join('\n');
      const textAfterUserUncheck = [
          '- [ ] Parent', // User unchecked this
          '  - [x] Child 1',
          '  - [x] Child 2',
      ].join('\n');

      it('should propagate down (uncheck) when child sync is ENABLED', () => { 
           const result = utilsDefault.syncText(textAfterUserUncheck, textBeforeUncheck);
           const expected = [
              '- [ ] Parent',
              '  - [ ] Child 1', // Propagated down
              '  - [ ] Child 2', // Propagated down
           ].join('\n');
           expect(result).toBe(expected);
      });

      it('should NOT propagate down (uncheck) when child sync is DISABLED', () => {
          const result = utilsChildSyncDisabled.syncText(textAfterUserUncheck, textBeforeUncheck); 
          const expected = [ // Ожидаем, что дети НЕ изменились
              '- [x] Parent', // propagateStateFromChildren
              '  - [x] Child 1',
              '  - [x] Child 2',
           ].join('\n');
           expect(result).toBe(expected);
      });

  });

    it('should update parent when parent sync is ENABLED and user checks last child', () => {
      const textBefore = [
        '- [ ] Parent',
        '  - [x] Child 1',
        '  - [ ] Child 2', // User will check this
      ].join('\n');
      const textAfterUserCheck = [
        '- [ ] Parent',
        '  - [x] Child 1',
        '  - [x] Child 2', // User checked this
      ].join('\n');

      const result = utilsDefault.syncText(textAfterUserCheck, textBefore);
      // SingleDiff won't trigger down prop. FromChildren runs.
      const expected = [
        '- [x] Parent', // Updated by FromChildren
        '  - [x] Child 1',
        '  - [x] Child 2',
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should NOT update parent when parent sync is DISABLED and user checks last child', () => {
      const textBefore = [
        '- [ ] Parent',
        '  - [x] Child 1',
        '  - [ ] Child 2', // User will check this
      ].join('\n');
      const textAfterChildCheck = [
        '- [ ] Parent',    // State before syncText runs propagateFromChildren
        '  - [x] Child 1',
        '  - [x] Child 2', // User checked this
      ].join('\n');
      const result = utilsParentSyncDisabled.syncText(textAfterChildCheck, textBefore); // Использует utilsParentSyncDisabled
      const expected = [ // Родитель НЕ должен обновиться
        '- [ ] Parent',
        '  - [x] Child 1',
        '  - [x] Child 2',
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should update parent when parent sync is ENABLED and user unchecks child', () => {
      const textBefore = [
        '- [x] Parent',
        '  - [x] Child 1', // User will uncheck this
        '  - [x] Child 2',
      ].join('\n');
      const textAfterUserUncheck = [
        '- [x] Parent',
        '  - [ ] Child 1', // User unchecked this
        '  - [x] Child 2',
      ].join('\n');

      const result = utilsDefault.syncText(textAfterUserUncheck, textBefore);
      // SingleDiff won't trigger down prop. FromChildren runs.
      const expected = [
        '- [ ] Parent', // Updated by FromChildren
        '  - [ ] Child 1',
        '  - [x] Child 2',
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should NOT update parent when parent sync is DISABLED and user unchecks child', () => {
      const textBefore = [
        '- [x] Parent',
        '  - [x] Child 1', // User will uncheck this
        '  - [x] Child 2',
      ].join('\n');
      const textAfterChildUncheck = [
        '- [x] Parent',    // State before syncText runs propagateFromChildren
        '  - [ ] Child 1', // User unchecked this
        '  - [x] Child 2',
      ].join('\n');
      const result = utilsParentSyncDisabled.syncText(textAfterChildUncheck, textBefore); // utilsParentSyncDisabled
      const expected = [ // Родитель НЕ должен обновиться
        '- [x] Parent',
        '  - [ ] Child 1',
        '  - [x] Child 2',
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should update parent based on children when multiple lines change and parent sync is ENABLED', () => {
      const textBefore = [
        '- [ ] Parent',
        '  - [ ] Child 1',
        '  - [ ] Child 2',
        '  - [ ] Child 3',
      ].join('\n');
      // User checks Parent AND Child 1, but leaves Child 2 unchecked
      const textAfterMultipleChanges = [
        '- [x] Parent',  // Changed by user
        '  - [x] Child 1', // Changed by user
        '  - [ ] Child 2', // Left unchecked
        '  - [ ] Child 3', // Left unchecked
      ].join('\n');

      const result = utilsDefault.syncText(textAfterMultipleChanges, textBefore);
      // SingleDiff won't run (2 changes). FromChildren runs.
      // Since Child 2/3 are unchecked, Parent should become unchecked.
      const expected = [
        '- [ ] Parent',  // Corrected by FromChildren
        '  - [x] Child 1',
        '  - [ ] Child 2',
        '  - [ ] Child 3',
      ].join('\n');
      expect(result).toBe(expected);
    });

    it('should NOT update parent when multiple lines change and parent sync is DISABLED', () => {
      const textBefore = [
        '- [ ] Parent',
        '  - [ ] Child 1',
        '  - [ ] Child 2',
      ].join('\n');
      const textAfterMultipleChanges = [ // User checks Parent and Child 1
        '- [x] Parent',
        '  - [x] Child 1',
        '  - [ ] Child 2',
      ].join('\n');
      const result = utilsParentSyncDisabled.syncText(textAfterMultipleChanges, textBefore); // utilsParentSyncDisabled
      const expected = [ // Родитель НЕ корректируется, остается как есть
        '- [x] Parent',
        '  - [x] Child 1',
        '  - [ ] Child 2',
      ].join('\n');
      expect(result).toBe(expected);
    });

  });
});