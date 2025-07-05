// import { CheckboxLineInfo, CheckboxUtils } from '../src/checkboxUtils'; // Путь к вашему файлу
import { CheckboxUtils2 } from 'src/core/CheckboxUtils2';
import { CheckboxSyncPluginSettings, DEFAULT_SETTINGS } from 'src/types'; // Путь к вашему файлу типов

// Вспомогательная функция для создания настроек с переопределениями
const createSettings = (overrides: Partial<CheckboxSyncPluginSettings> = {}): Readonly<CheckboxSyncPluginSettings> => {
	return { ...DEFAULT_SETTINGS, ...overrides } as Readonly<CheckboxSyncPluginSettings>;
};

describe('CheckboxUtils2', () => {
	// --- Тесты для syncText ---
	describe('syncText', () => {
		it('should propagate down only if child sync enabled and diff matches', () => {
			const utils = new CheckboxUtils2(createSettings({
				enableAutomaticChildState: true,
				enableAutomaticParentState: false, // Parent sync off
			}));
			const textBefore = [
				'- [ ] Parent',
				'  - [ ] Child',
			].join('\n');
			const textAfterParentChecked = [ // Simulate user checking parent
				'- [x] Parent',
				'  - [ ] Child',
			].join('\n');
			const expected = [
				'- [x] Parent',
				'  - [x] Child', // Propagated down
			].join('\n');
			expect(utils.syncText(textAfterParentChecked, textBefore)).toBe(expected);
		});

		it('should propagate up only if parent sync enabled', () => {
			const utils = new CheckboxUtils2(createSettings({
				enableAutomaticChildState: false, // Child sync off
				enableAutomaticParentState: true,
			}));
			const textBefore = [
				'- [ ] Parent',
				'  - [ ] Child',
			].join('\n');
			const textAfterChildChecked = [ // Simulate user checking child
				'- [ ] Parent',
				'  - [x] Child',
			].join('\n');
			const expected = [
				'- [x] Parent', // Propagated up
				'  - [x] Child',
			].join('\n');
			// syncText calls propagateFromChildren unconditionally if enabled
			expect(utils.syncText(textAfterChildChecked, textBefore)).toBe(expected);
		});

		it('should propagate down then up if both enabled', () => {
			const utils = new CheckboxUtils2(createSettings({
				enableAutomaticChildState: true,
				enableAutomaticParentState: true,
			}));
			const textBefore = [
				'- [ ] Parent',
				'  - [ ] Child',
			].join('\n');
			const textAfterParentChecked = [ // Simulate user checking parent
				'- [x] Parent',
				'  - [ ] Child',
			].join('\n');
			// 1. User checks parent: '- [x] Parent', '  - [ ] Child'
			// 2. Propagate down:   '- [x] Parent', '  - [x] Child'
			// 3. Propagate up:     (no change needed as parent is already checked)
			const expectedDown = [
				'- [x] Parent',
				'  - [x] Child', // Propagated down
			].join('\n');
			expect(utils.syncText(textAfterParentChecked, textBefore)).toBe(expectedDown);

			const textAfterChildChecked = [ // Simulate user checking child
				'- [ ] Parent',
				'  - [x] Child',
			].join('\n');
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
			const utils = new CheckboxUtils2(createSettings({
				enableAutomaticChildState: false,
				enableAutomaticParentState: false,
			}));
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
			expect(utils.syncText(textAfterParentChecked, textBefore)).toBe(textAfterParentChecked);
			expect(utils.syncText(textAfterChildChecked, textBefore)).toBe(textAfterChildChecked);
		});

		it('should not propagate down if diff is not a single checkbox state change', () => {
			const utils = new CheckboxUtils2(createSettings({
				enableAutomaticChildState: true, // Down propagation enabled
				enableAutomaticParentState: false,
			}));
			const textBefore = [
				'- [ ] Parent',
				'  - [ ] Child',
			].join('\n');
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

		it('equals texts', () => {
			const utils = new CheckboxUtils2(createSettings({
				enableAutomaticChildState: true, // Down propagation enabled
				enableAutomaticParentState: true,
			}));
			const textBefore = [
				'- [ ] Parent',
				'  - [ ] Child',
			].join('\n');

			// Multiple lines changed
			expect(utils.syncText(textBefore, textBefore)).toBe(textBefore);
		});

		it('checkbox, list', ()=> {
			const utils = new CheckboxUtils2(createSettings({
				enableAutomaticChildState: true,
				enableAutomaticParentState: true,
			}));
			const textBefore = [
				'- [ ] Parent',
				'  - Child1',
				'  - [ ] Child2',
			].join('\n');
			const actualText = [
				'- [ ] Parent',
				'  - Child1',
				'  - [x] Child2',
			].join('\n');
			const expectedText = [
				'- [x] Parent',
				'  - Child1',
				'  - [x] Child2',
			].join('\n');

			// Multiple lines changed
			expect(utils.syncText(actualText, textBefore)).toBe(expectedText);
		});

		it('checkbox, plain text', ()=> {
			const utils = new CheckboxUtils2(createSettings({
				enableAutomaticChildState: true,
				enableAutomaticParentState: true,
			}));
			const textBefore = [
				'- [ ] Parent',
				'  Child1',
				'  - [ ] Child2',
			].join('\n');
			const actualText = [
				'- [ ] Parent',
				'  Child1',
				'  - [x] Child2',
			].join('\n');
			const expectedText = [
				'- [x] Parent',
				'  Child1',
				'  - [x] Child2',
			].join('\n');

			// Multiple lines changed
			expect(utils.syncText(actualText, textBefore)).toBe(expectedText);
		});

		describe('without textBefore', () => {
			it('done from child to parent', () => {
				const utils = new CheckboxUtils2(createSettings({
					enableAutomaticChildState: true,
					enableAutomaticParentState: true,
				}));
				const actualText = [
					'- [ ] Parent',
					'  - [x] Child',
				].join('\n');
				const expected = [
					'- [x] Parent',
					'  - [x] Child',
				].join('\n');
				expect(utils.syncText(actualText, undefined)).toBe(expected);
			});
			it('todo from child to parent', () => {
				const utils = new CheckboxUtils2(createSettings({
					enableAutomaticChildState: true,
					enableAutomaticParentState: true,
				}));
				const actualText = [
					'- [x] Parent',
					'  - [ ] Child',
				].join('\n');
				const expected = [
					'- [ ] Parent',
					'  - [ ] Child',
				].join('\n');
				expect(utils.syncText(actualText, undefined)).toBe(expected);
			});
		});
		describe('many roots', () => {
			it('two roots witout text before', () => {
				const utils = new CheckboxUtils2(createSettings({
					enableAutomaticChildState: true,
					enableAutomaticParentState: true,
				}));
				const actualText = [
					'- [x] Parent1',
					'  - [ ] Child1',
					'- [ ] Parent2',
					'  - [x] Child2',
				].join('\n');
				const expected = [
					'- [ ] Parent1',
					'  - [ ] Child1',
					'- [x] Parent2',
					'  - [x] Child2',
				].join('\n');
				expect(utils.syncText(actualText, undefined)).toBe(expected);
			});

			it('two roots', () => {
				const utils = new CheckboxUtils2(createSettings({
					enableAutomaticChildState: true,
					enableAutomaticParentState: true,
				}));
				const textBefore = [
					'- [x] Parent1',
					'  - [x] Child1',
					'- [ ] Parent2',
					'  - [ ] Child2',
				].join('\n');
				const actualText = [
					'- [x] Parent1',
					'  - [ ] Child1',
					'- [ ] Parent2',
					'  - [x] Child2',
				].join('\n');
				const expected = [
					'- [ ] Parent1',
					'  - [ ] Child1',
					'- [x] Parent2',
					'  - [x] Child2',
				].join('\n');
				expect(utils.syncText(actualText, textBefore)).toBe(expected);
			});

			it('all type roots', () => {
				const utils = new CheckboxUtils2(createSettings({
					enableAutomaticChildState: true,
					enableAutomaticParentState: true,
				}));
				const textBefore = [
					'- [x] Parent1',
					'  - [x] Child1',
					'- Parent2',
					'  - Child2',
					'Parent3',
					'  Child3',
				].join('\n');
				const actualText = [
					'- [x] Parent1',
					'  - [ ] Child1',
					'- Parent2',
					'  - Child2',
					'Parent3',
					'  Child3',
				].join('\n');
				const expected = [
					'- [ ] Parent1',
					'  - [ ] Child1',
					'- Parent2',
					'  - Child2',
					'Parent3',
					'  Child3',
				].join('\n');
				expect(utils.syncText(actualText, textBefore)).toBe(expected);
			});			
		});

	});
});