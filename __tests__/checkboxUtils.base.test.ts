import { CheckboxLineInfo, CheckboxUtils } from '../src/core/checkboxUtils'; // Путь к вашему файлу
import { CheckboxState, CheckboxSyncPluginSettings, DEFAULT_SETTINGS } from '../src/types'; // Путь к вашему файлу типов

// Вспомогательная функция для создания настроек с переопределениями
const createSettings = (overrides: Partial<CheckboxSyncPluginSettings> = {}): Readonly<CheckboxSyncPluginSettings> => {
	return { ...DEFAULT_SETTINGS, ...overrides } as Readonly<CheckboxSyncPluginSettings>;
};

describe('CheckboxUtils', () => {
	let checkboxUtils: CheckboxUtils;
	let settings: Readonly<CheckboxSyncPluginSettings>;

	beforeEach(() => {
		// Используем настройки по умолчанию для большинства тестов
		settings = createSettings();
		checkboxUtils = new CheckboxUtils(settings);
	});

	// --- Тесты для matchCheckboxLine ---
	describe('matchCheckboxLine', () => {
		it('should match standard unchecked checkbox', () => {
			const line = '- [ ] Task';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 0,
				marker: '-',
				checkChar: ' ',
				checkboxCharPosition: 3,
				checkboxState: CheckboxState.Unchecked,
				isChecked: false,
				listItemText: "Task",
			});
		});

		it('should match standard checked checkbox', () => {
			const line = '* [x] Done';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 0,
				marker: '*',
				checkChar: 'x',
				checkboxCharPosition: 3,
				checkboxState: CheckboxState.Checked,
				isChecked: true,
				listItemText: "Done",
			});
		});

		it('should match checkbox with indentation', () => {
			const line = '  + [x] Indented Task';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 2,
				marker: '+',
				checkChar: 'x',
				checkboxCharPosition: 5, // 2 spaces + 1 marker + 1 space + 1 [ = 5
				checkboxState: CheckboxState.Checked,
				isChecked: true,
				listItemText: "Indented Task",
			});
		});

		it('should match numbered list checkbox', () => {
			const line = '1. [ ] Numbered';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 0,
				marker: '1.',
				checkChar: ' ',
				checkboxCharPosition: 4, // 2 marker + 1 space + 1 [ = 4
				checkboxState: CheckboxState.Unchecked,
				isChecked: false,
				listItemText: "Numbered",
			});
		});

		it('should match checkbox with multi-digit numbered list', () => {
			const line = '10. [x] Double Digit';
			const result = checkboxUtils.matchCheckboxLine(line);
			expect(result).not.toBeNull();
			expect(result).toEqual({
				indent: 0,
				marker: '10.',
				checkChar: 'x',
				checkboxCharPosition: 5, // 3 marker + 1 space + 1 [ = 5
				checkboxState: CheckboxState.Checked,
				isChecked: true,
				listItemText: "Double Digit",
			});
		});

		it('should return null for lines without checkbox format', () => {
			expect(checkboxUtils.matchCheckboxLine('Just text')).toBeNull();
			expect(checkboxUtils.matchCheckboxLine('- [ ]')).toBeNull(); // No space after ]
			expect(checkboxUtils.matchCheckboxLine('- [] ')).toBeNull(); // No char inside
			expect(checkboxUtils.matchCheckboxLine('[ ] Task')).toBeNull(); // No marker
			expect(checkboxUtils.matchCheckboxLine('-[ ] Task')).toBeNull(); // No space after marker
		});

		it('should match custom symbols based on settings', () => {
			const customSettings = createSettings({
				checkedSymbols: ['X', 'V'],
				uncheckedSymbols: ['O', '-'],
				ignoreSymbols: ['~'],
			});
			const customUtils = new CheckboxUtils(customSettings);

			const checkedLine = '- [V] Custom Checked';
			const checkedResult = customUtils.matchCheckboxLine(checkedLine);
			expect(checkedResult?.checkboxState).toBe(CheckboxState.Checked);
			expect(checkedResult?.isChecked).toBe(true);
			expect(checkedResult?.checkChar).toBe('V');

			const uncheckedLine = '* [O] Custom Unchecked';
			const uncheckedResult = customUtils.matchCheckboxLine(uncheckedLine);
			expect(uncheckedResult?.checkboxState).toBe(CheckboxState.Unchecked);
			expect(uncheckedResult?.isChecked).toBe(false);
			expect(uncheckedResult?.checkChar).toBe('O');

			const ignoredLine = '+ [~] Custom Ignored';
			const ignoredResult = customUtils.matchCheckboxLine(ignoredLine);
			expect(ignoredResult?.checkboxState).toBe(CheckboxState.Ignore);
			expect(ignoredResult?.isChecked).toBeUndefined();
			expect(ignoredResult?.checkChar).toBe('~');
		});
	});

	// --- Тесты для getCheckboxState ---
	describe('getCheckboxState', () => {
		it('should return Checked for symbols in checkedSymbols', () => {
			const customSettings = createSettings({ checkedSymbols: ['x', 'X', '✓'] });
			const customUtils = new CheckboxUtils(customSettings);
			expect(customUtils.getCheckboxState('x')).toBe(CheckboxState.Checked);
			expect(customUtils.getCheckboxState('X')).toBe(CheckboxState.Checked);
			expect(customUtils.getCheckboxState('✓')).toBe(CheckboxState.Checked);
		});

		it('should return Unchecked for symbols in uncheckedSymbols', () => {
			const customSettings = createSettings({ uncheckedSymbols: [' ', '_', '?'] });
			const customUtils = new CheckboxUtils(customSettings);
			expect(customUtils.getCheckboxState(' ')).toBe(CheckboxState.Unchecked);
			expect(customUtils.getCheckboxState('_')).toBe(CheckboxState.Unchecked);
			expect(customUtils.getCheckboxState('?')).toBe(CheckboxState.Unchecked);
		});

		it('should return Ignore for symbols in ignoreSymbols', () => {
			const customSettings = createSettings({ ignoreSymbols: ['-', '~', '>'] });
			const customUtils = new CheckboxUtils(customSettings);
			expect(customUtils.getCheckboxState('-')).toBe(CheckboxState.Ignore);
			expect(customUtils.getCheckboxState('~')).toBe(CheckboxState.Ignore);
			expect(customUtils.getCheckboxState('>')).toBe(CheckboxState.Ignore);
		});

		it('should use unknownSymbolPolicy for symbols not in any list', () => {
			const settingsChecked = createSettings({ unknownSymbolPolicy: CheckboxState.Checked });
			const utilsChecked = new CheckboxUtils(settingsChecked);
			expect(utilsChecked.getCheckboxState('?')).toBe(CheckboxState.Checked);

			const settingsUnchecked = createSettings({ unknownSymbolPolicy: CheckboxState.Unchecked });
			const utilsUnchecked = new CheckboxUtils(settingsUnchecked);
			expect(utilsUnchecked.getCheckboxState('?')).toBe(CheckboxState.Unchecked);

			const settingsIgnore = createSettings({ unknownSymbolPolicy: CheckboxState.Ignore });
			const utilsIgnore = new CheckboxUtils(settingsIgnore);
			expect(utilsIgnore.getCheckboxState('?')).toBe(CheckboxState.Ignore);
		});
	});

	// --- Тесты для updateLineCheckboxStateWithInfo ---
	describe('updateLineCheckboxStateWithInfo', () => {
		it('should update checkbox state from unchecked to checked', () => {
			const line = '- [ ] Task';
			const lineInfo = checkboxUtils.matchCheckboxLine(line)!; // Assume valid line
			const updatedLine = checkboxUtils.updateLineCheckboxStateWithInfo(line, true, lineInfo);
			// Uses the first symbol from settings.checkedSymbols ('x' by default)
			expect(updatedLine).toBe('- [x] Task');
		});

		it('should update checkbox state from checked to unchecked', () => {
			const line = '* [x] Done';
			const lineInfo = checkboxUtils.matchCheckboxLine(line)!;
			const updatedLine = checkboxUtils.updateLineCheckboxStateWithInfo(line, false, lineInfo);
			// Uses the first symbol from settings.uncheckedSymbols (' ' by default)
			expect(updatedLine).toBe('* [ ] Done');
		});

		it('should use first symbol from settings for update', () => {
			const customSettings = createSettings({ checkedSymbols: ['V', 'X'], uncheckedSymbols: ['O', ' '] });
			const customUtils = new CheckboxUtils(customSettings);

			const lineToCheck = '- [O] Task';
			const infoToCheck = customUtils.matchCheckboxLine(lineToCheck)!;
			const updatedToCheck = customUtils.updateLineCheckboxStateWithInfo(lineToCheck, true, infoToCheck);
			expect(updatedToCheck).toBe('- [V] Task'); // Should use 'V'

			const lineToUncheck = '* [V] Done';
			const infoToUncheck = customUtils.matchCheckboxLine(lineToUncheck)!;
			const updatedToUncheck = customUtils.updateLineCheckboxStateWithInfo(lineToUncheck, false, infoToUncheck);
			expect(updatedToUncheck).toBe('* [O] Done'); // Should use 'O'
		});

		it('should handle indented lines correctly', () => {
			const line = '  - [ ] Indented';
			const lineInfo = checkboxUtils.matchCheckboxLine(line)!;
			const updatedLine = checkboxUtils.updateLineCheckboxStateWithInfo(line, true, lineInfo);
			expect(updatedLine).toBe('  - [x] Indented');
		});

		it('should return original line if position is invalid (simulated)', () => {
			const line = '- [ ] Task';
			const lineInfo = checkboxUtils.matchCheckboxLine(line)!;
			// Simulate invalid position
			const invalidInfo = { ...lineInfo, checkboxCharPosition: 100 };
			const updatedLine = checkboxUtils.updateLineCheckboxStateWithInfo(line, true, invalidInfo);
			expect(updatedLine).toBe(line); // Should not change
		});

		it('should use default checked symbol "x" if checkedSymbols setting is empty', () => {
			// Создаем настройки с пустым списком checkedSymbols
			const customSettings = createSettings({ checkedSymbols: [] });
			const customUtils = new CheckboxUtils(customSettings);
			const line = '- [ ] Task';
			const lineInfo = customUtils.matchCheckboxLine(line)!;

			// Пытаемся отметить чекбокс
			const updatedLine = customUtils.updateLineCheckboxStateWithInfo(line, true, lineInfo);
			expect(updatedLine).toBe('- [x] Task'); // Ожидаем дефолтный 'x'
		});

		it('should use default unchecked symbol " " if uncheckedSymbols setting is empty', () => {
			// Создаем настройки с пустым списком uncheckedSymbols
			const customSettings = createSettings({ uncheckedSymbols: [] });
			const customUtils = new CheckboxUtils(customSettings);
			const line = '- [x] Task'; // Используем 'x' из дефолтных checkedSymbols
			const lineInfo = customUtils.matchCheckboxLine(line)!;

			// Пытаемся снять отметку
			const updatedLine = customUtils.updateLineCheckboxStateWithInfo(line, false, lineInfo);
			expect(updatedLine).toBe('- [ ] Task'); // Ожидаем дефолтный ' ' (пробел)
		});

		// Усиленный тест для невалидной позиции (с проверкой console.warn)
		it('should return original line and warn if position is invalid', () => {
			const line = '- [ ] Task';
			const lineInfo = checkboxUtils.matchCheckboxLine(line)!;
			// Мокаем console.warn
			const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

			// Simulate invalid position
			const invalidInfo = { ...lineInfo, checkboxCharPosition: -1 }; // Невалидная позиция
			const updatedLineNegative = checkboxUtils.updateLineCheckboxStateWithInfo(line, true, invalidInfo);
			expect(updatedLineNegative).toBe(line); // Должен вернуть оригинальную строку
			expect(warnSpy).toHaveBeenCalledTimes(1); // Проверяем вызов warn

			const invalidInfo2 = { ...lineInfo, checkboxCharPosition: 100 }; // Другая невалидная позиция
			const updatedLineOob = checkboxUtils.updateLineCheckboxStateWithInfo(line, true, invalidInfo2);
			expect(updatedLineOob).toBe(line); // Должен вернуть оригинальную строку
			expect(warnSpy).toHaveBeenCalledTimes(2); // Проверяем вызов warn еще раз

			// Восстанавливаем оригинальную функцию console.warn
			warnSpy.mockRestore();
		});

		it('should return original line and warn if checkboxCharPosition is invalid for a valid checkbox type', () => {
			const line = '- [ ] Task';
			const lineInfo = checkboxUtils.matchCheckboxLine(line)!; // Это валидный чекбокс
			const invalidPosInfo = { ...lineInfo, checkboxCharPosition: -1 }; // Невалидная позиция
			const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
			const updatedLine = checkboxUtils.updateLineCheckboxStateWithInfo(line, true, invalidPosInfo);
			expect(updatedLine).toBe(line);
			expect(warnSpy).toHaveBeenCalledWith("updateLineCheckboxStateWithInfo: Invalid checkbox position in lineInfo for line:", line);
			warnSpy.mockRestore();
		});

		it('UPDATE_LINE: should return original line and warn if lineInfo is for NoCheckbox', () => {
			const line = "- Plain item";
			// Создаем lineInfo, как будто он пришел от plain list item
			const plainLineInfo: CheckboxLineInfo = {
				indent: 0,
				marker: '-',
				checkboxState: CheckboxState.NoCheckbox, // Ключевой момент
				listItemText: 'Plain item',
				// checkboxCharPosition не важен, т.к. до него не дойдет
			};

			const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

			const updatedLine = checkboxUtils.updateLineCheckboxStateWithInfo(line, true, plainLineInfo);

			expect(updatedLine).toBe(line); // Строка не должна измениться
			expect(warnSpy).toHaveBeenCalledWith("updateLineCheckboxStateWithInfo: Invalid lineInfo(no checkbox) for line:", line);

			warnSpy.mockRestore();
		});
	});

	// --- Тесты для propagateStateToChildren ---
	describe('propagateStateToChildren', () => {
		const setupUtils = (customSettings?: Partial<CheckboxSyncPluginSettings>) => {
			return new CheckboxUtils(createSettings(customSettings));
		}

		it('should check children when parent is checked', () => {
			const text = [
				'- [x] Parent', // line 0
				'  - [ ] Child 1',
				'    - [ ] Grandchild',
				'  - [ ] Child 2',
				'- [ ] Sibling',
			].join('\n');
			const expected = [
				'- [x] Parent',
				'  - [x] Child 1',
				'    - [x] Grandchild',
				'  - [x] Child 2',
				'- [ ] Sibling', // Sibling should not change
			].join('\n');
			expect(checkboxUtils.propagateStateToChildren(text, 0)).toBe(expected);
		});

		it('should uncheck children when parent is unchecked', () => {
			const text = [
				'- [ ] Parent', // line 0
				'  - [x] Child 1',
				'    - [x] Grandchild',
				'  - [ ] Child 2', // Already unchecked
				'- [x] Sibling',
			].join('\n');
			const expected = [
				'- [ ] Parent',
				'  - [ ] Child 1',
				'    - [ ] Grandchild',
				'  - [ ] Child 2',
				'- [x] Sibling', // Sibling should not change
			].join('\n');
			expect(checkboxUtils.propagateStateToChildren(text, 0)).toBe(expected);
		});

		it('should stop propagation at siblings or less indented lines', () => {
			const text = [
				'  - [x] Parent', // line 0
				'    - [ ] Child',
				'  - [ ] Sibling', // Same indent level
				'- [ ] Less Indented',
			].join('\n');
			const expected = [
				'  - [x] Parent',
				'    - [x] Child', // Changed
				'  - [ ] Sibling', // Not changed
				'- [ ] Less Indented', // Not changed
			].join('\n');
			expect(checkboxUtils.propagateStateToChildren(text, 0)).toBe(expected);
		});

		it('should skip ignored children and their subtrees', () => {
			const utils = setupUtils({ ignoreSymbols: ['~'] });
			const text = [
				'- [x] Parent',         // 0
				'  - [ ] Child 1',      // 1
				'  - [~] Ignored Child',// 2 (ignore)
				'    - [ ] Skipped GC', // 3 (skipped because parent ignored)
				'  - [ ] Child 2',      // 4
			].join('\n');
			const expected = [
				'- [x] Parent',
				'  - [x] Child 1',      // Changed
				'  - [~] Ignored Child',// Unchanged
				'    - [ ] Skipped GC', // Unchanged
				'  - [x] Child 2',      // Changed
			].join('\n');
			expect(utils.propagateStateToChildren(text, 0)).toBe(expected);
		});

		it('should do nothing if the parent line is not a checkbox', () => {
			const text = [
				'Parent Line',
				'  - [ ] Child',
			].join('\n');
			expect(checkboxUtils.propagateStateToChildren(text, 0)).toBe(text);
		});

		it('should do nothing if the parent checkbox is ignored', () => {
			const utils = setupUtils({ ignoreSymbols: ['~'] });
			const text = [
				'- [~] Ignored Parent', // 0
				'  - [ ] Child',
			].join('\n');
			expect(utils.propagateStateToChildren(text, 0)).toBe(text);
		});

		it('should return original text and warn if parent line index does not contain a list item', () => {
			const text = "Not a list item\n  - [ ] Child";
			const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
			const result = checkboxUtils.propagateStateToChildren(text, 0);
			expect(result).toBe(text);
			expect(warnSpy).toHaveBeenCalledWith("checkbox not found in line 0");
			warnSpy.mockRestore();
		});

		it('should stop propagation if a non-list-item line is encountered among children', () => {
			const text = [
				'- [x] Parent',
				'  Not a child list item', // This will make childLineInfo null
				'  - [ ] Grandchild (should not be processed)',
			].join('\n');
			const expected = [
				'- [x] Parent',
				'  Not a child list item',
				'  - [ ] Grandchild (should not be processed)',
			].join('\n');
			expect(checkboxUtils.propagateStateToChildren(text, 0)).toBe(expected);
		});

		it('should correctly stop processing sub-children of an ignored node if a non-list-item is found', () => {
			const utils = new CheckboxUtils(createSettings({ ignoreSymbols: ['~'] }));
			const text = [
				'- [x] Parent',
				'  - [~] Ignored Child',
				'    - [ ] Valid Sub-Child (will be skipped by inner loop)', // j инкрементируется
				'    Not a sub-child list item', // subChildLineInfo = null, inner loop breaks
				'    - [ ] Another Sub-Child (SHOULD NOT BE SKIPPED by inner loop, as it breaks, and also not processed by outer loop)',
				'  - [ ] Next Sibling of Ignored', // This should also not be processed due to outer loop break
			].join('\n');

			// Ожидаем, что Parent и Ignored Child останутся, а остальное не изменится,
			// потому что внешний цикл прервется после обработки "Not a sub-child list item"
			const expected = [
				'- [x] Parent',
				'  - [~] Ignored Child',
				'    - [ ] Valid Sub-Child (will be skipped by inner loop)',
				'    Not a sub-child list item',
				'    - [ ] Another Sub-Child (SHOULD NOT BE SKIPPED by inner loop, as it breaks, and also not processed by outer loop)',
				'  - [ ] Next Sibling of Ignored',
			].join('\n');

			const result = utils.propagateStateToChildren(text, 0);
			expect(result).toBe(expected);
			// В данном случае, поскольку Parent [x], и мы ничего не меняем, результат будет равен text.
			// Важно то, что Next Sibling of Ignored не стал [x].
		});
	});

	// --- Тесты для propagateStateFromChildren ---
	describe('propagateStateFromChildren', () => {
		const setupUtils = (customSettings?: Partial<CheckboxSyncPluginSettings>) => {
			return new CheckboxUtils(createSettings(customSettings));
		}

		it('should check parent if all children are checked', () => {
			const text = [
				'- [ ] Parent', // line 0
				'  - [x] Child 1',
				'  - [x] Child 2',
				'    - [x] Grandchild', // Needs parent (Child 2) to be checked first
			].join('\n');
			// Expected: Grandchild affects Child 2 -> Child 2 and Child 1 affect Parent
			const expectedPass1 = [ // After processing Grandchild and Child 2
				'- [ ] Parent',
				'  - [x] Child 1',
				'  - [x] Child 2', // Stays checked
				'    - [x] Grandchild',
			].join('\n');
			const expectedPass2 = [ // After processing Child 1 and Parent
				'- [x] Parent', // Changes to checked
				'  - [x] Child 1',
				'  - [x] Child 2',
				'    - [x] Grandchild',
			].join('\n');
			// Since it processes bottom-up, Child 2 should already be evaluated correctly
			expect(checkboxUtils.propagateStateFromChildren(text)).toBe(expectedPass2);
		});

		it('should uncheck parent if any child is unchecked', () => {
			const text = [
				'- [x] Parent', // line 0
				'  - [x] Child 1',
				'  - [ ] Child 2', // This one makes the parent unchecked
				'    - [ ] Grandchild',
			].join('\n');
			const expected = [
				'- [ ] Parent', // Changes to unchecked
				'  - [x] Child 1',
				'  - [ ] Child 2',
				'    - [ ] Grandchild',
			].join('\n');
			expect(checkboxUtils.propagateStateFromChildren(text)).toBe(expected);
		});

		it('should handle nested updates correctly (bottom-up)', () => {
			const text = [
				'- [ ] Grandparent',  // 0
				'  - [ ] Parent 1',   // 1
				'    - [x] Child 1.1',// 2
				'    - [x] Child 1.2',// 3
				'  - [x] Parent 2',   // 4
				'    - [ ] Child 2.1',// 5 (Makes Parent 2 unchecked)
			].join('\n');
			const expected = [
				'- [ ] Grandparent', // Becomes unchecked (because Parent 2 becomes unchecked)
				'  - [x] Parent 1',  // Becomes checked (Child 1.1, 1.2 are checked)
				'    - [x] Child 1.1',
				'    - [x] Child 1.2',
				'  - [ ] Parent 2',  // Becomes unchecked (Child 2.1 is unchecked)
				'    - [ ] Child 2.1',
			].join('\n');
			expect(checkboxUtils.propagateStateFromChildren(text)).toBe(expected);
		});

		it('should not change parent state if it has no relevant children', () => {
			const text = [
				'- [ ] Parent',
				'Sibling', // Not a child checkbox
				'  Not indented correctly',
			].join('\n');
			expect(checkboxUtils.propagateStateFromChildren(text)).toBe(text);
		});

		it('should ignore non-checkbox lines when determining parent state', () => {
			const text = [
				'- [ ] Parent',
				'  - [x] Child 1',
				'  Just text',
				'  - [x] Child 2',
			].join('\n');
			const expected = [
				'- [x] Parent', // Should become checked
				'  - [x] Child 1',
				'  Just text',
				'  - [x] Child 2',
			].join('\n');
			expect(checkboxUtils.propagateStateFromChildren(text)).toBe(expected);
		});

		it('should skip ignored children when determining parent state', () => {
			const utils = setupUtils({ ignoreSymbols: ['~'] });
			const text = [
				'- [ ] Parent',         // 0
				'  - [x] Child 1',      // 1
				'  - [~] Ignored Child',// 2 (skipped)
				'    - [ ] Skipped GC', // 3 (doesn't affect parent)
				'  - [x] Child 2',      // 4
			].join('\n');
			const expected = [
				'- [x] Parent', // Becomes checked (based on Child 1 and Child 2 only)
				'  - [x] Child 1',
				'  - [~] Ignored Child',
				'    - [ ] Skipped GC',
				'  - [x] Child 2',
			].join('\n');
			expect(utils.propagateStateFromChildren(text)).toBe(expected);
		});

		it('should not change parent state if all direct children are ignored', () => {
			const utils = setupUtils({ ignoreSymbols: ['~'] });
			const text = [
				'- [ ] Parent',         // 0
				'  - [~] Ignored 1',    // 1
				'  - [~] Ignored 2',    // 2
			].join('\n');
			expect(utils.propagateStateFromChildren(text)).toBe(text); // Parent stays unchecked
			const text2 = [
				'- [x] Parent',         // 0
				'  - [~] Ignored 1',    // 1
				'  - [~] Ignored 2',    // 2
			].join('\n');
			expect(utils.propagateStateFromChildren(text2)).toBe(text2); // Parent stays checked
		});

		it('should not update ignored parents', () => {
			const utils = setupUtils({ ignoreSymbols: ['~'] });
			const text = [
				'- [~] Ignored Parent', // 0
				'  - [x] Child 1',
				'  - [x] Child 2',
			].join('\n');
			expect(utils.propagateStateFromChildren(text)).toBe(text); // Parent remains ignored
		});

		it('should stop searching children when a line with equal or lesser indent is found', () => {
			const text = [
				'- [ ] Parent 1',          // indent 0
				'Some regular text',       // indent 0. Stops search for Parent 1 children.
				'  - [x] Child 1.1',       // indent 2. Should be ignored for Parent 1.
				'- [ ] Parent 2',          // indent 0. Processed independently.
				'  - [x] Child 2.1',       // indent 2. Child of Parent 2.
			].join('\n');

			const result = checkboxUtils.propagateStateFromChildren(text);

			const expected = [
				'- [ ] Parent 1',          // Unchanged (no children found before stop)
				'Some regular text',
				'  - [x] Child 1.1',
				'- [x] Parent 2',          // Updated by Child 2.1
				'  - [x] Child 2.1',
			].join('\n');
			expect(result).toBe(expected);
		});


		it('should stop searching children when a sibling checkbox (equal/lesser indent) is found', () => {
			const text = [
				'- [ ] Parent 1',          // indent 0
				'- [ ] Sibling Parent',    // indent 0. Stops search for Parent 1 children.
				'  - [x] Child SP.1',      // indent 2. Belongs to Sibling Parent.
			].join('\n');

			const result = checkboxUtils.propagateStateFromChildren(text);

			const expected = [
				'- [ ] Parent 1',          // Unchanged (no children found before stop)
				'- [x] Sibling Parent',    // Updated by Child SP.1
				'  - [x] Child SP.1',
			].join('\n');
			expect(result).toBe(expected);

			const text2 = [
				'  - [ ] Parent 1',        // indent 2
				'    - [x] Child 1.1',     // indent 4
				'  - [ ] Sibling Parent',  // indent 2. Stops search for Parent 1 children.
				'    - [ ] Child SP.1',    // indent 4. Belongs to Sibling Parent.
			].join('\n');
			const result2 = checkboxUtils.propagateStateFromChildren(text2);
			const expected2 = [
				'  - [x] Parent 1',        // Updated by Child 1.1
				'    - [x] Child 1.1',
				'  - [ ] Sibling Parent',  // Unchanged (Child SP.1 is unchecked)
				'    - [ ] Child SP.1',
			].join('\n');
			expect(result2).toBe(expected2);
		});

		it('should ignore non-list-item lines when iterating upwards', () => {
			const text = [
				'- [ ] Parent',
				' - [x] Child',
				'Just some random text in between', // parentLineInfo will be null for this 
				'- [ ] Another Parent',
				' - [x] Another Child',
			].join('\n');
			const expected = [
				'- [x] Parent',
				' - [x] Child',
				'Just some random text in between',
				'- [x] Another Parent',
				' - [x] Another Child',
			].join('\n');
			expect(checkboxUtils.propagateStateFromChildren(text)).toBe(expected);
		});
	});

	// --- Тесты для syncText ---
	describe('syncText', () => {
		const textBefore = [
			'- [ ] Parent',
			'  - [ ] Child',
		].join('\n');
		const textAfterParentChecked = [ // Simulate user checking parent
			'- [x] Parent',
			'  - [ ] Child',
		].join('\n');
		const textAfterChildChecked = [ // Simulate user checking child
			'- [ ] Parent',
			'  - [x] Child',
		].join('\n');

		it('should propagate down only if child sync enabled and diff matches', () => {
			const utils = new CheckboxUtils(createSettings({
				enableAutomaticChildState: true,
				enableAutomaticParentState: false, // Parent sync off
			}));
			const expected = [
				'- [x] Parent',
				'  - [x] Child', // Propagated down
			].join('\n');
			expect(utils.syncText(textAfterParentChecked, textBefore)).toBe(expected);
		});

		it('should propagate up only if parent sync enabled', () => {
			const utils = new CheckboxUtils(createSettings({
				enableAutomaticChildState: false, // Child sync off
				enableAutomaticParentState: true,
			}));
			const expected = [
				'- [x] Parent', // Propagated up
				'  - [x] Child',
			].join('\n');
			// syncText calls propagateFromChildren unconditionally if enabled
			expect(utils.syncText(textAfterChildChecked, textBefore)).toBe(expected);
		});

		it('should propagate down then up if both enabled', () => {
			const utils = new CheckboxUtils(createSettings({
				enableAutomaticChildState: true,
				enableAutomaticParentState: true,
			}));
			// 1. User checks parent: '- [x] Parent', '  - [ ] Child'
			// 2. Propagate down:   '- [x] Parent', '  - [x] Child'
			// 3. Propagate up:     (no change needed as parent is already checked)
			const expectedDown = [
				'- [x] Parent',
				'  - [x] Child', // Propagated down
			].join('\n');
			expect(utils.syncText(textAfterParentChecked, textBefore)).toBe(expectedDown);

			// 1. User checks child: '- [ ] Parent', '  - [x] Child'
			// 2. Propagate down:   (no change, as only one line changed, and it wasn't the parent)
			// 3. Propagate up:     '- [x] Parent', '  - [x] Child'
			const expectedUp = [
				'- [x] Parent', // Propagated up
				'  - [x] Child',
			].join('\n');
			expect(utils.syncText(textAfterChildChecked, textBefore)).toBe(expectedUp);
		});

		it('should do nothing if both syncs disabled', () => {
			const utils = new CheckboxUtils(createSettings({
				enableAutomaticChildState: false,
				enableAutomaticParentState: false,
			}));
			expect(utils.syncText(textAfterParentChecked, textBefore)).toBe(textAfterParentChecked);
			expect(utils.syncText(textAfterChildChecked, textBefore)).toBe(textAfterChildChecked);
		});

		it('should not propagate down if diff is not a single checkbox state change', () => {
			const utils = new CheckboxUtils(createSettings({
				enableAutomaticChildState: true, // Down propagation enabled
				enableAutomaticParentState: false,
			}));
			const textMultipleChanges = [
				'- [x] Parent Changed', // Text changed too
				'  - [x] Child also changed',
			].join('\n');
			const textIndentChange = [
				'  - [x] Parent', // Indent changed
				'    - [ ] Child',
			].join('\n');

			// Multiple lines changed
			expect(utils.syncText(textMultipleChanges, textBefore)).toBe(textMultipleChanges);
			// Indent changed (diff > 1 line index)
			expect(utils.syncText(textIndentChange, textBefore)).toBe(textIndentChange);
		});
	});

	// --- Тесты для propagateStateToChildrenFromSingleDiff ---
	describe('propagateStateToChildrenFromSingleDiff', () => {
		const textBefore = [
			'- [ ] Parent',
			'  - [ ] Child',
		].join('\n');

		it('should propagate if only checkbox state changed', () => {
			const textAfter = [
				'- [x] Parent', // Only state changed
				'  - [ ] Child',
			].join('\n');
			const expected = [
				'- [x] Parent',
				'  - [x] Child', // Propagated
			].join('\n');
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfter, textBefore)).toBe(expected);
		});

		it('should propagate if text content also changed', () => {
			const textAfter = [
				'- [x] Parent Changed Text', // State and text changed
				'  - [ ] Child',
			].join('\n');
			const expected = [
				'- [x] Parent Changed Text',
				'  - [x] Child', // Propagated
			].join('\n');
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfter, textBefore)).toBe(expected);
		});

		it('should NOT propagate if marker changed', () => {
			const textAfter = [
				'* [x] Parent', // Marker changed from - to *
				'  - [ ] Child',
			].join('\n');
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfter, textBefore)).toBe(textAfter);
		});

		it('should NOT propagate if indentation changed', () => {
			const textAfter = [
				'  - [x] Parent', // Indentation changed
				'  - [ ] Child',
			].join('\n');
			// This will be detected as > 1 line difference by findDifferentLineIndexes
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfter, textBefore)).toBe(textAfter);
		});


		it('should NOT propagate if multiple lines changed', () => {
			const textAfter = [
				'- [x] Parent',
				'  - [x] Child', // Second line also changed
			].join('\n');
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfter, textBefore)).toBe(textAfter);
		});

		it('should NOT propagate if changed line is not a checkbox', () => {
			const textBeforeNonCheck = "Line 1\nLine 2";
			const textAfterNonCheck = "Line 1 changed\nLine 2";
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfterNonCheck, textBeforeNonCheck)).toBe(textAfterNonCheck);
		});

		it('should propagate if changed line is an ignored checkbox', () => {
			const utils = new CheckboxUtils(createSettings({ ignoreSymbols: ['~'] }));
			const textBeforeIgnored = [
				'- [~] Parent',
				'  - [ ] Child',
			].join('\n');
			const textAfterIgnored = [
				'- [x] Parent', // Changed FROM ignored TO checked
				'  - [ ] Child',
			].join('\n');
			const expected = [
				'- [x] Parent',
				'  - [x] Child', // Propagated
			].join('\n');

			expect(utils.propagateStateToChildrenFromSingleDiff(textAfterIgnored, textBeforeIgnored)).toBe(expected);
		});

		it('should return original text if textBefore is undefined', () => {
			const text = '- [ ] Line';
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(text, undefined)).toBe(text);
		});

		it('should return original text if line counts differ', () => {
			const text1 = '- [ ] Line1\n- [ ] Line2';
			const text2 = '- [ ] Line1';
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(text1, text2)).toBe(text1);
		});

		it('should return original text if textBefore and text have different line counts', () => {
			const textBefore = "- [ ] Line 1";
			const text = "- [ ] Line 1\n- [ ] Line 2";
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(text, textBefore)).toBe(text);
		});

		it('should return original text if no lines changed (diffIndexes.length === 0)', () => {
			const text = "- [ ] Task";
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(text, text)).toBe(text);
		});

		it('should return original text if multiple lines changed (diffIndexes.length > 1)', () => {
			const textBefore = "- [ ] Task1\n- [ ] Task2";
			const textAfter = "- [x] Task1\n- [x] Task2"; // 2 diffs
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfter, textBefore)).toBe(textAfter);
		});

		it('should not propagate if changed line was not a list item before', () => {
			const textBefore = "Not a list item";
			const textAfter = "- [x] Became a list item";
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfter, textBefore)).toBe(textAfter);
		});

		it('should not propagate if changed line is not a list item after', () => {
			const textBefore = "- [ ] Was a list item";
			const textAfter = "Not a list item anymore";
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfter, textBefore)).toBe(textAfter);
		});

		it('should not propagate if indent changed', () => {
			const textBeforeIndent = [
				"- [ ] Parent",
				"  - [ ] Child",
			].join('\n');
			const textAfterIndent = [
				"  - [ ] Parent",
				"  - [ ] Child",
			].join('\n'); // Parent indent changed
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfterIndent, textBeforeIndent)).toBe(textAfterIndent);
		});

		it('should not propagate if marker changed', () => {
			const textBefore = "- [ ] Item\n  - [ ] Child";
			const textAfter = "* [ ] Item\n  - [ ] Child"; // Marker changed
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfter, textBefore)).toBe(textAfter);
		});

		it('should not propagate if checkbox state did not change (e.g., only text content)', () => {
			const textBefore = "- [x] Task Alpha\n  - [ ] Child";
			const textAfter = "- [x] Task Bravo\n  - [ ] Child"; // Only text changed
			expect(checkboxUtils.propagateStateToChildrenFromSingleDiff(textAfter, textBefore)).toBe(textAfter);
		});
	});

	// --- Тесты для findDifferentLineIndexes ---
	describe('findDifferentLineIndexes', () => {
		it('should return empty array for identical lines', () => {
			const lines1 = ['a', 'b', 'c'];
			const lines2 = ['a', 'b', 'c'];
			expect(checkboxUtils.findDifferentLineIndexes(lines1, lines2)).toEqual([]);
		});

		it('should return index of the single different line', () => {
			const lines1 = ['a', 'b', 'c'];
			const lines2 = ['a', 'B', 'c'];
			expect(checkboxUtils.findDifferentLineIndexes(lines1, lines2)).toEqual([1]);
		});

		it('should return indexes of multiple different lines', () => {
			const lines1 = ['a', 'b', 'c', 'd'];
			const lines2 = ['A', 'b', 'C', 'd'];
			expect(checkboxUtils.findDifferentLineIndexes(lines1, lines2)).toEqual([0, 2]);
		});

		it('should detect differences at start and end', () => {
			const lines1 = ['a', 'b', 'c'];
			const lines2 = ['X', 'b', 'Y'];
			expect(checkboxUtils.findDifferentLineIndexes(lines1, lines2)).toEqual([0, 2]);
		});

		it('should throw error if line arrays have different lengths', () => {
			const lines1 = ['a', 'b'];
			const lines2 = ['a', 'b', 'c'];
			expect(() => checkboxUtils.findDifferentLineIndexes(lines1, lines2))
				.toThrow("the length of the lines must be equal");
			expect(() => checkboxUtils.findDifferentLineIndexes(lines2, lines1))
				.toThrow("the length of the lines must be equal");
		});
	});

});
