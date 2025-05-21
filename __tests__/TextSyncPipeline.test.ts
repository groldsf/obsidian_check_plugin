import { CheckboxUtils } from "src/checkboxUtils";
import { FileFilter } from "src/FileFilter";
import TextSyncPipeline from "src/TextSyncPipeline";
import { CheckboxSyncPluginSettings, DEFAULT_SETTINGS } from "src/types";
import { InMemoryFilePathStateHolder } from "./fakes/InMemoryFilePathStateHolder";

describe('TextSyncPipeline E2E-like Tests', () => {
	let fakeFileStateHolder: InMemoryFilePathStateHolder;
	let checkboxUtils: CheckboxUtils;
	let fileFilter: FileFilter;
	let pipeline: TextSyncPipeline;
	let settings: CheckboxSyncPluginSettings;

	beforeEach(() => {
		// Используем настройки по умолчанию для большинства тестов,
		// их можно переопределять для специфических сценариев
		settings = { ...DEFAULT_SETTINGS };

		fakeFileStateHolder = new InMemoryFilePathStateHolder();
		checkboxUtils = new CheckboxUtils(settings);
		fileFilter = new FileFilter(settings); // Инициализируем с настройками

		pipeline = new TextSyncPipeline(checkboxUtils, fakeFileStateHolder, fileFilter);
	});

	// --- Тесты на разрешение путей и кеширование ---

	describe('Path Filtering and Caching Logic', () => {
		it('process: when path is NOT allowed, should return original text and cache original text', () => {
			// Настраиваем FileFilter, чтобы он запрещал путь
			settings.pathGlobs = ["restricted/path.md"]; // Этот путь будет игнорироваться
			fileFilter.updateSettings(settings); // Обновляем фильтр с новыми глобами

			const filePath = "restricted/path.md";
			const currentText = "- [ ] task 1\n- [x] task 2";

			// Act
			const resultText = pipeline.applySyncLogic(currentText, filePath);

			// Assert
			// 1. Текст не должен измениться
			expect(resultText).toBe(currentText);
			// 2. Оригинальный текст должен быть закеширован
			expect(fakeFileStateHolder.getInternalState(filePath)).toBe(currentText);
		});

		it('process: when path IS allowed, but no sync changes occur, should return original text and cache original (synced) text', () => {
			// Путь разрешен по умолчанию (pathGlobs пустой)
			settings.pathGlobs = [];
			fileFilter.updateSettings(settings);

			const filePath = "allowed/path.md";
			// Текст, который не будет изменен CheckboxUtils при текущих настройках
			// (например, нет родительских/дочерних для пропагации, или они уже синхронизованы)
			const currentText = "- [ ] task 1\n- [ ] task 2";
			const previousTextInHolder = "- [ ] task 1\n- [ ] task 2"; // Предположим, предыдущее состояние было таким же

			fakeFileStateHolder.setInitialStates({ [filePath]: previousTextInHolder });

			// Act
			const resultText = pipeline.applySyncLogic(currentText, filePath);

			// Assert
			// 1. Текст не должен измениться (т.к. syncText вернул то же самое)
			expect(resultText).toBe(currentText);
			// 2. В кеше должен быть этот же (оригинальный/синхронизированный) текст
			expect(fakeFileStateHolder.getInternalState(filePath)).toBe(currentText);
		});

		it('process: when path IS allowed and sync changes occur, should return modified text and cache modified text', () => {
			// Путь разрешен
			settings.pathGlobs = [];
			fileFilter.updateSettings(settings);
			// Включаем автоматическую пропагацию, чтобы изменения точно были
			settings.enableAutomaticChildState = true;
			checkboxUtils = new CheckboxUtils(settings); // Пересоздаем с новыми настройками
			pipeline = new TextSyncPipeline(checkboxUtils, fakeFileStateHolder, fileFilter);


			const filePath = "allowed/changes.md";
			const currentText = "- [x] parent\n  - [ ] child"; // Родитель изменен, дочерний должен измениться
			const previousTextInHolder = "- [ ] parent\n  - [ ] child"; // Предыдущее состояние

			fakeFileStateHolder.setInitialStates({ [filePath]: previousTextInHolder });

			// Act
			const resultText = pipeline.applySyncLogic(currentText, filePath);
			const expectedTextAfterSync = "- [x] parent\n  - [x] child"; // Ожидаемый результат от CheckboxUtils

			// Assert
			// 1. Текст должен измениться
			expect(resultText).toBe(expectedTextAfterSync);
			// 2. В кеше должен быть измененный текст
			expect(fakeFileStateHolder.getInternalState(filePath)).toBe(expectedTextAfterSync);
		});

		it('process: when path IS allowed and file was not in state holder, should process and cache result', () => {
			settings.pathGlobs = [];
			fileFilter.updateSettings(settings);
			settings.enableAutomaticChildState = true;
			checkboxUtils = new CheckboxUtils(settings);
			pipeline = new TextSyncPipeline(checkboxUtils, fakeFileStateHolder, fileFilter);

			const filePath = "allowed/new_file.md";
			const currentText = "- [x] parent\n  - [ ] child";
			// Предыдущего состояния нет в fakeFileStateHolder

			// Act
			const resultText = pipeline.applySyncLogic(currentText, filePath);
			const expectedTextAfterSync = "- [ ] parent\n  - [ ] child";

			// Assert
			expect(resultText).toBe(expectedTextAfterSync);
			expect(fakeFileStateHolder.getInternalState(filePath)).toBe(expectedTextAfterSync);
		});

		it('process: subsequent calls for the same allowed path should use updated cached state', () => {
			settings.pathGlobs = [];
			fileFilter.updateSettings(settings);
			settings.enableAutomaticChildState = true;
			checkboxUtils = new CheckboxUtils(settings);
			pipeline = new TextSyncPipeline(checkboxUtils, fakeFileStateHolder, fileFilter);

			const filePath = "allowed/sequential.md";
			const initialText = "- [ ] parent\n  - [ ] child 1";
			const textAfterFirstEdit = "- [x] parent\n  - [ ] child 1"; // Пользователь изменил родителя
			const expectedAfterFirstPipeline = "- [x] parent\n  - [x] child 1";

			// Первый вызов (например, после первого изменения в редакторе)
			fakeFileStateHolder.setByPath(filePath, initialText);
			let resultText = pipeline.applySyncLogic(textAfterFirstEdit, filePath); // previousText будет undefined
			expect(resultText).toBe(expectedAfterFirstPipeline);
			expect(fakeFileStateHolder.getInternalState(filePath)).toBe(expectedAfterFirstPipeline);

			// Второе изменение (пользователь снимает галочку с родителя)
			const textAfterSecondEdit = "- [ ] parent\n  - [x] child 1"; // previousText теперь expectedAfterFirstPipeline
			const expectedAfterSecondPipeline = "- [ ] parent\n  - [ ] child 1";

			resultText = pipeline.applySyncLogic(textAfterSecondEdit, filePath);
			expect(resultText).toBe(expectedAfterSecondPipeline);
			expect(fakeFileStateHolder.getInternalState(filePath)).toBe(expectedAfterSecondPipeline);
		});
	});

	// --- Можно добавить тесты на специфическое поведение CheckboxUtils через pipeline ---
	// Например, если enableAutomaticParentState = true и т.д.

	describe('CheckboxUtils Behavior through Pipeline (Path Allowed)', () => {
		beforeEach(() => {
			// Убедимся, что путь всегда разрешен для этих тестов
			settings.pathGlobs = [];
			fileFilter.updateSettings(settings);
		});

		it('process: should propagate state to children if enabled', () => {
			settings.enableAutomaticChildState = true;
			checkboxUtils = new CheckboxUtils(settings); // Обновляем CheckboxUtils
			pipeline = new TextSyncPipeline(checkboxUtils, fakeFileStateHolder, fileFilter);

			const filePath = "test.md";
			const previousText = "- [ ] Parent\n  - [ ] Child";
			const currentText = "- [x] Parent\n  - [ ] Child"; // Пользователь отметил родителя
			const expectedText = "- [x] Parent\n  - [x] Child";

			fakeFileStateHolder.setInitialStates({ [filePath]: previousText });
			const result = pipeline.applySyncLogic(currentText, filePath);
			expect(result).toBe(expectedText);
			expect(fakeFileStateHolder.getInternalState(filePath)).toBe(expectedText);
		});

		it('process: should propagate state from children if enabled', () => {
			settings.enableAutomaticParentState = true;
			// Убедимся, что child state не влияет на этот тест, если он не нужен
			settings.enableAutomaticChildState = false;
			checkboxUtils = new CheckboxUtils(settings);
			pipeline = new TextSyncPipeline(checkboxUtils, fakeFileStateHolder, fileFilter);

			const filePath = "test.md";
			// Предыдущее состояние не так важно, если мы не проверяем diff-логику
			const currentText = "- [ ] Parent\n  - [x] Child 1\n  - [x] Child 2"; // Дети отмечены
			const expectedText = "- [x] Parent\n  - [x] Child 1\n  - [x] Child 2"; // Родитель должен стать отмеченным

			const result = pipeline.applySyncLogic(currentText, filePath);
			expect(result).toBe(expectedText);
			expect(fakeFileStateHolder.getInternalState(filePath)).toBe(expectedText);
		});
	});

	describe('Text content variations (Path Allowed)', () => {
		beforeEach(() => {
			// Убедимся, что путь всегда разрешен для этих тестов
			settings.pathGlobs = [];
			fileFilter.updateSettings(settings);
			// Оставляем настройки CheckboxUtils по умолчанию, если не указано иное
			checkboxUtils = new CheckboxUtils(settings);
			pipeline = new TextSyncPipeline(checkboxUtils, fakeFileStateHolder, fileFilter);
		});

		it('process: text with no checkboxes should return original text and cache it', () => {
			const filePath = "text_files/no_checkboxes.md";
			const currentText = "This is a line.\nAnd another line without any checkboxes.";
			const previousTextInHolder = "Some old text";

			fakeFileStateHolder.setInitialStates({ [filePath]: previousTextInHolder });

			// Act
			const resultText = pipeline.applySyncLogic(currentText, filePath);

			// Assert
			expect(resultText).toBe(currentText);
			// CheckboxUtils.syncText не должен был ничего изменить
			expect(fakeFileStateHolder.getInternalState(filePath)).toBe(currentText);
		});

		it('process: text with only ignored checkboxes should return original text and cache it', () => {
			settings.ignoreSymbols = ["~"];
			checkboxUtils = new CheckboxUtils(settings); // Обновляем с новыми ignoreSymbols
			pipeline = new TextSyncPipeline(checkboxUtils, fakeFileStateHolder, fileFilter);

			const filePath = "text_files/ignored_checkboxes.md";
			const currentText = "- [~] An ignored task\n  - [~] Another sub-task also ignored";
			const previousTextInHolder = "- [~] An old ignored task";

			fakeFileStateHolder.setInitialStates({ [filePath]: previousTextInHolder });

			// Act
			const resultText = pipeline.applySyncLogic(currentText, filePath);

			// Assert
			expect(resultText).toBe(currentText);
			expect(fakeFileStateHolder.getInternalState(filePath)).toBe(currentText);
		});
	});
});
