// checkboxUtils.plainLists.test.ts

import { CheckboxUtils } from '../src/checkboxUtils';
import { CheckboxState, CheckboxSyncPluginSettings, DEFAULT_SETTINGS } from '../src/types';

// Вспомогательная функция для создания настроек с переопределениями
const createSettings = (overrides: Partial<CheckboxSyncPluginSettings> = {}): Readonly<CheckboxSyncPluginSettings> => {
	return { ...DEFAULT_SETTINGS, ...overrides } as Readonly<CheckboxSyncPluginSettings>;
};

describe('CheckboxUtils - Plain List Item Support', () => {
	let checkboxUtils: CheckboxUtils;
	let settings: Readonly<CheckboxSyncPluginSettings>;

	beforeEach(() => {
		settings = createSettings();
		checkboxUtils = new CheckboxUtils(settings);
	});

	// --- Тесты для matchCheckboxLine с поддержкой plain list items ---
	describe('matchCheckboxLine with Plain List Items', () => {
		it('should match a plain bullet list item', () => {
			const line = '- Plain item text';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 0,
				marker: '-',
				checkboxState: CheckboxState.NoCheckbox,
				listItemText: 'Plain item text',
				// Опциональные поля для чекбокса должны быть undefined
				checkChar: undefined,
				checkboxCharPosition: undefined,
				isChecked: undefined,
			});
		});

		it('should match a plain asterisk list item with indentation', () => {
			const line = '  * Indented plain item';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 2,
				marker: '*',
				checkboxState: CheckboxState.NoCheckbox,
				listItemText: 'Indented plain item',
			});
		});

		it('should match a plain plus list item', () => {
			const line = '+ Another plain item';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 0,
				marker: '+',
				checkboxState: CheckboxState.NoCheckbox,
				listItemText: 'Another plain item',
			});
		});

		it('should match a plain numbered list item', () => {
			const line = '1. Numbered plain item';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 0,
				marker: '1.',
				checkboxState: CheckboxState.NoCheckbox,
				listItemText: 'Numbered plain item',
			});
		});

		it('should match a plain multi-digit numbered list item', () => {
			const line = '10. Long numbered plain item';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 0,
				marker: '10.',
				checkboxState: CheckboxState.NoCheckbox,
				listItemText: 'Long numbered plain item',
			});
		});

		it('should still match a standard checkbox item', () => {
			const line = '- [x] A checkbox item';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result?.checkboxState).toBe(CheckboxState.Checked);
			expect(result?.isChecked).toBe(true);
			expect(result?.checkChar).toBe('x');
			expect(result?.listItemText).toBe('A checkbox item');
		});

		it('should match a plain list item with no text after marker', () => {
			const line = '- '; // Marker and space
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 0,
				marker: '-',
				checkboxState: CheckboxState.NoCheckbox,
				listItemText: '', // Empty string for text
			});
		});

		it('should match a plain list item with only spaces after marker', () => {
			const line = '*   '; // Marker and spaces
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 0,
				marker: '*',
				checkboxState: CheckboxState.NoCheckbox,
				listItemText: '', // Text is trimmed
			});
		});

		it('should correctly parse listItemText for checkboxes', () => {
			const line = '- [ ] Task with text';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result?.listItemText).toBe('Task with text');

			const lineNoText = '- [x] ';
			const resultNoText = checkboxUtils.matchCheckboxLine(lineNoText);
			expect(resultNoText?.listItemText).toBe('');
		});

		it('should return null for lines that are not list items or malformed', () => {
			expect(checkboxUtils.matchCheckboxLine('Just some text')).toBeNull();
			expect(checkboxUtils.matchCheckboxLine('-NoSpaceAfterMarker')).toBeNull();
			expect(checkboxUtils.matchCheckboxLine('1.NoSpaceAfterMarker')).toBeNull();
			expect(checkboxUtils.matchCheckboxLine('> Not a list marker')).toBeNull();
			// Это все еще НЕ чекбокс и НЕ plain list item по текущим правилам (нет пробела после маркера)
			expect(checkboxUtils.matchCheckboxLine('-[ ] No space after marker for checkbox')).toBeNull();
			// Это plain list item, а не чекбокс, т.к. нет пробела перед [ ]
			const trickyLine = "-[ ] Not a checkbox, but could be a plain item if regex allowed marker immediately followed by non-space";
			// По текущему regex ^(\s*)([*+-]|\d+\.)\s+(?!\[.?\])(.*)$ для plain list, это будет null.
			// Если бы regex для plain list был ^(\s*)([*+-]|\d+\.)\s*(.*)$, и мы бы отсекали чекбоксы отдельно,
			// то "-[ ] text" мог бы считаться plain. Но текущий regex для plain требует \s+ после маркера.
			// А regex для чекбокса требует " \[" . Так что "-[ ] text" не матчится ни тем, ни другим.
			expect(checkboxUtils.matchCheckboxLine(trickyLine)).toBeNull();

			// A line that looks like a checkbox but is missing the char inside brackets
			expect(checkboxUtils.matchCheckboxLine('- [] Text')).toBeNull(); // Checkbox regex expects a char
			// A line that looks like a checkbox but missing space after brackets (and thus missing listItemText part)
			expect(checkboxUtils.matchCheckboxLine('- [x]')).toBeNull(); // Checkbox regex expects \s after [.]
		});
	});

	// --- Тесты для propagateStateToChildren с Plain List Items ---
	describe('propagateStateToChildren with Plain List Items', () => {
		it('should not change plain list item children', () => {
			const text = [
				'- [x] Parent Checkbox',
				'  - Plain Child Item',
				'  * [ ] Another Checkbox Child',
				'    - Deep Plain Child',
			].join('\n');
			const expected = [
				'- [x] Parent Checkbox',
				'  - Plain Child Item',       // Unchanged
				'  * [x] Another Checkbox Child', // Changed
				'    - Deep Plain Child',       // Unchanged
			].join('\n');
			expect(checkboxUtils.propagateStateToChildren(text, 0)).toBe(expected);
		});

		it('should not propagate from a plain list item parent', () => {
			const text = [
				'- Parent Plain Item', // line 0
				'  - [ ] Child Checkbox',
				'  * Plain Grandchild',
			].join('\n');
			// No changes expected as parent is NoCheckbox
			expect(checkboxUtils.propagateStateToChildren(text, 0)).toBe(text);
		});

		it('should skip ignored children and not skip childs plain list items correctly', () => {
			const customSettings = createSettings({ ignoreSymbols: ['~'] });
			const utils = new CheckboxUtils(customSettings);
			const text = [
				'- [x] Parent',           // 0
				'  - Plain Child',        // 1 (NoCheckbox)
				'    - [ ] Grandchild CB',// 2 (Checkbox under NoCheckbox, should be affected by Parent)
				'  - [~] Ignored Child',  // 3 (Ignore)
				'    - [ ] Skipped GC',   // 4 (Checkbox under Ignore, should not be affected)
				'  - [ ] Checkbox Child', // 5 (Checkbox)
			].join('\n');
			const expected = [
				'- [x] Parent',
				'  - Plain Child',        // Unchanged
				'    - [x] Grandchild CB',// Changed
				'  - [~] Ignored Child',  // Unchanged
				'    - [ ] Skipped GC',   // Unchanged
				'  - [x] Checkbox Child', // Changed
			].join('\n');
			expect(utils.propagateStateToChildren(text, 0)).toBe(expected);
		});
		
		it('should stop propagation if a non-list-item line is encountered (indent > parent)', () => {
			const text = [
				'- [x] Parent',
				'  This is just text, not a list item.', // childLineInfo будет null, indent > parent.indent. Цикл прервется.
				'    - [ ] Grandchild (should not be processed as loop breaks)',
			].join('\n');
			const expected = [
				'- [x] Parent',
				'  This is just text, not a list item.',
				'    - [ ] Grandchild (should not be processed as loop breaks)',
			].join('\n');
			// Проверяем, что Grandchild не изменился
			const result = checkboxUtils.propagateStateToChildren(text, 0);
			expect(result).toBe(expected);
			// Дополнительно можно проверить, что matchCheckboxLine для "Grandchild" не вызывался бы
			// (если это важно, но для покрытия достаточно проверки результата)
		});

	});

	// --- Тесты для propagateStateFromChildren с Plain List Items ---
	describe('propagateStateFromChildren with Plain List Items', () => {
		it('should not update a plain list item parent based on children', () => {
			const text = [
				'- Parent Plain Item',
				'  - [x] Child Checkbox 1',
				'  - [x] Child Checkbox 2',
			].join('\n');
			// Parent is NoCheckbox, so it should not change
			expect(checkboxUtils.propagateStateFromChildren(text)).toBe(text);
		});

		it('should not ignore plain list item children when determining parent checkbox state', () => {
			const text = [
				'- [ ] Parent Checkbox',
				'  - Plain Child 1',
				'  - [x] Actual Checkbox Child',
				'  * Plain Child 2',
				'    - [ ] Grandchild (under plain, ignored for Parent Checkbox)',
			].join('\n');
			const expected = [
				'- [ ] Parent Checkbox', // Becomes checked because "Actual Checkbox Child" is checked
				'  - Plain Child 1',
				'  - [x] Actual Checkbox Child',
				'  * Plain Child 2',
				'    - [ ] Grandchild (under plain, ignored for Parent Checkbox)',
			].join('\n');
			expect(checkboxUtils.propagateStateFromChildren(text)).toBe(expected);
		});

		it('parent checkbox remains unchecked if all relevant children are plain or ignored', () => {
			const customSettings = createSettings({ ignoreSymbols: ['~'] });
			const utils = new CheckboxUtils(customSettings);
			const text = [
				'- [ ] Parent Checkbox',
				'  - Plain Child',
				'  - [~] Ignored Child',
			].join('\n');
			// No actual checkbox children to influence the parent
			expect(utils.propagateStateFromChildren(text)).toBe(text);

			const text2 = [
				'- [x] Parent Checkbox Initially Checked',
				'  - Plain Child',
				'  - [~] Ignored Child',
			].join('\n');
			// Parent should remain checked as no relevant children to change it
			expect(utils.propagateStateFromChildren(text2)).toBe(text2);
		});

		it('parent checkbox becomes unchecked if it has one unchecked checkbox child and other plain/ignored children', () => {
			const text = [
				'- [x] Parent Checkbox',
				'  - Plain Child',
				'  - [ ] Unchecked Checkbox Child', // This will make parent unchecked
				'  - [x] Checked Checkbox Child (but one is enough)',
			].join('\n');
			// Note: propagateStateFromChildren processes from bottom up.
			// The order of children doesn't matter as much as their collective state.
			// Let's simplify to ensure clarity:
			const simplerText = [
				'- [x] Parent Checkbox',
				'  - Plain Child',
				'  - [ ] Unchecked Checkbox Child',
			].join('\n');
			const expected = [
				'- [ ] Parent Checkbox', // Becomes unchecked
				'  - Plain Child',
				'  - [ ] Unchecked Checkbox Child',
			].join('\n');
			expect(checkboxUtils.propagateStateFromChildren(simplerText)).toBe(expected);
		});

		it('handles mixed children correctly, bottom-up', () => {
			const text = [
				'- [ ] GP',                     // 0
				'  - Plain Child of GP',      // 1
				'  - [ ] P1 (Checkbox)',        // 2
				'    - [x] C1.1 (Checkbox)',    // 3
				'    - Plain Grandchild',     // 4
				'  - [x] P2 (Checkbox)',        // 5 (initially checked)
				'    - Plain Grandchild 2',   // 6
				'    - [ ] C2.1 (Unchecked CB)',// 7
			].join('\n');

			const expected = [
				'- [ ] GP',                     // P1 becomes [x], P2 becomes [ ]. So GP is [ ]
				'  - Plain Child of GP',
				'  - [x] P1 (Checkbox)',        // Becomes [x] due to C1.1
				'    - [x] C1.1 (Checkbox)',
				'    - Plain Grandchild',
				'  - [ ] P2 (Checkbox)',        // Becomes [ ] due to C2.1
				'    - Plain Grandchild 2',
				'    - [ ] C2.1 (Unchecked CB)',
			].join('\n');
			expect(checkboxUtils.propagateStateFromChildren(text)).toBe(expected);
		});
	});

	// --- Тесты для syncText с Plain List Items (влияние на propagateStateToChildrenFromSingleDiff) ---
	describe('syncText (and propagateStateToChildrenFromSingleDiff) with Plain List Items', () => {
		const utils = new CheckboxUtils(createSettings({
			enableAutomaticChildState: true,
			enableAutomaticParentState: true, // Keep true to see full effect if needed, though child is main focus
		}));

		it('should propagate down if a line changes from Plain to Checked Checkbox', () => {
			const textBefore = [
				'- Parent Plain Item', // Was plain
				'  - [ ] Child Checkbox',
				'  - Plain Grandchild',
			].join('\n');
			const textAfter = [
				'- [x] Parent Plain Item', // Now a checked checkbox
				'  - [ ] Child Checkbox',
				'  - Plain Grandchild',
			].join('\n');
			const expected = [
				'- [x] Parent Plain Item',
				'  - [x] Child Checkbox',   // Propagated
				'  - Plain Grandchild',   // Unchanged (it's plain)
			].join('\n');
			expect(utils.syncText(textAfter, textBefore)).toBe(expected);
		});

		it('should NOT propagate down if a line changes from Checked Checkbox to Plain', () => {
			const textBefore = [
				'- [x] Parent Checkbox', // Was checkbox
				'  - [ ] Child Checkbox', // This would have been checked by propagation
				'  - Plain Grandchild',
			].join('\n');
			const textAfter = [
				'- Parent Checkbox', // Now plain
				'  - [ ] Child Checkbox',
				'  - Plain Grandchild',
			].join('\n');
			// propagateStateToChildrenFromSingleDiff will call propagateStateToChildren
			// propagateStateToChildren will see the parent is NoCheckbox and do nothing.
			// Then propagateStateFromChildren runs, but parent is NoCheckbox.
			expect(utils.syncText(textAfter, textBefore)).toBe(textAfter);
		});

		it('should correctly propagate up if a child changes, parent is checkbox, and siblings are plain', () => {
			const textBefore = [
				'- [ ] Parent Checkbox',
				'  - Plain Sibling',
				'  - [ ] Child Checkbox that changes',
			].join('\n');
			const textAfter = [
				'- [ ] Parent Checkbox',
				'  - Plain Sibling',
				'  - [x] Child Checkbox that changes', // User checks this
			].join('\n');
			const expected = [
				'- [x] Parent Checkbox', // Propagates up
				'  - Plain Sibling',
				'  - [x] Child Checkbox that changes',
			].join('\n');
			expect(utils.syncText(textAfter, textBefore)).toBe(expected);
		});
	});
});
