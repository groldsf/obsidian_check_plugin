import { FileFilter } from "src/FileFilter";
import { CheckboxSyncPluginSettings, DEFAULT_SETTINGS } from "src/types";

const createSettings = (pathGlobs: string[]): Readonly<CheckboxSyncPluginSettings> => ({
	...DEFAULT_SETTINGS,
	pathGlobs,
});

describe('FileFilter with "ignore" library (.gitignore-style logic)', () => {
	describe('isPathAllowed should return true if file is NOT ignored, false if IGNORED', () => {
		const testCases = [
			// --- Базовые случаи ---
			{ name: 'No globs: any/file.md', globs: [], path: 'any/file.md', expected: true }, // Not ignored
			{ name: 'Empty glob string: any/file.md', globs: [''], path: 'any/file.md', expected: true }, // Not ignored
			{ name: 'Comment only: any/file.md', globs: ['#comment'], path: 'any/file.md', expected: true }, // Not ignored
			{ name: 'Empty and comment: any/file.md', globs: ['', '#comment'], path: 'any/file.md', expected: true }, // Not ignored

			// --- Простое исключение (файл ИГНОРИРУЕТСЯ -> isPathAllowed: false) ---
			{ name: 'Exclude folder logs/: logs/error.log', globs: ['logs/'], path: 'logs/error.log', expected: false },
			{ name: 'Exclude folder logs/: data/file.md (not in folder)', globs: ['logs/'], path: 'data/file.md', expected: true },
			{ name: 'Exclude *.tmp: file.tmp', globs: ['*.tmp'], path: 'file.tmp', expected: false },
			{ name: 'Exclude *.tmp: file.md (different type)', globs: ['*.tmp'], path: 'file.md', expected: true },
			{ name: 'Exclude secret.md: secret.md', globs: ['secret.md'], path: 'secret.md', expected: false },

			// --- Правило: "Нельзя пере-включить файл, если его родительская директория исключена" ---
			// Тесты, которые раньше падали из-за моего неверного expected: true
			{
				name: 'Parent Excluded 1: logs/, !logs/important.log -> logs/important.log',
				globs: ['logs/', '!logs/important.log'],
				path: 'logs/important.log',
				expected: false // Stays ignored because 'logs/' is excluded
			},
			{
				name: 'Parent Excluded 2: docs/, !docs/README.md -> docs/README.md',
				globs: ['docs/', '!docs/README.md'],
				path: 'docs/README.md',
				expected: false // Stays ignored
			},
			{
				name: 'Parent Excluded 3: *, !projects/** -> projects/my/file.md',
				globs: ['*', '!projects/**'],
				path: 'projects/my/file.md',
				expected: false // Stays ignored because 'projects/' (or '*' matching it) is excluded
			},
			{
				name: 'Parent Excluded 4: .obsidian/, !.obsidian/config -> .obsidian/config',
				globs: ['.obsidian/', '!.obsidian/config'],
				path: '.obsidian/config',
				expected: false // Stays ignored
			},

			// --- Случаи, где правило о родительской директории НЕ применяется, и ! отменяет предыдущее ---
			// Здесь мы не исключаем родительскую директорию целиком, а только файлы по паттерну
			{
				name: 'Negation Works 1: *.js, !src/safe.js -> src/safe.js',
				globs: ['*.js', '!src/safe.js'],
				path: 'src/safe.js',
				expected: true // Not ignored
			},
			{
				name: 'Negation Works 2: *.js, !src/safe.js -> lib/bad.js',
				globs: ['*.js', '!src/safe.js'],
				path: 'lib/bad.js',
				expected: false // Ignored by *.js
			},
			{
				name: 'Negation Works 3: specific.md, !specific.md -> specific.md',
				globs: ['specific.md', '!specific.md'],
				path: 'specific.md',
				expected: true // Not ignored
			},


			// --- Проверка правила о родительской директории более явно ---
			// Сначала исключаем родителя, потом пытаемся включить ребенка И родителя
			{
				name: 'Parent Excluded then Re-include Parent: logs/, !logs/ -> logs/important.log',
				globs: ['logs/', '!logs/'], // !logs/ отменяет logs/ для самой папки logs и ее содержимого
				path: 'logs/important.log',
				expected: true // logs/important.log НЕ игнорируется
			},
			{
				name: 'Parent Excluded then Re-include Parent & Child: logs/, !logs/, !logs/important.log -> logs/important.log',
				globs: ['logs/', '!logs/', '!logs/important.log'], // !logs/important.log здесь избыточно, но для теста
				path: 'logs/important.log',
				expected: true // НЕ игнорируется
			},
			// Исключаем папку, потом пытаемся включить подпапку - НЕ СРАБОТАЕТ для файлов ВНУТРИ подпапки
			{
				name: 'Exclude parent, try un-ignore sub-folder: top/, !top/mid/ -> top/mid/file.txt',
				globs: ['top/', '!top/mid/'],
				path: 'top/mid/file.txt',
				expected: false // 'top/' excluded, so 'top/mid/file.txt' is ignored. '!top/mid/' cannot un-ignore contents.
			},
			// Но если мы хотим работать с top/mid/, нам нужно отменить top/ СНАЧАЛА для top/mid/
			{
				name: 'Un-ignore sub-folder first, then parent: !top/mid/, top/ -> top/mid/file.txt',
				globs: ['!top/mid/', 'top/'], // 'top/' will re-ignore 'top/mid/file.txt'. Last rule wins if parent rule is not violated.
				path: 'top/mid/file.txt',
				expected: false
			},
			{
				name: 'Un-ignore sub-folder from wildcard: *, !top/mid/** -> top/mid/file.txt',
				globs: ['*', '!top/mid/**'], // '*' excludes 'top/', then '!top/mid/**' tries to un-exclude. Parent 'top/' is excluded.
				path: 'top/mid/file.txt',
				expected: false // Parent 'top/' is excluded by '*', so '!top/mid/**' has no effect on contents.
			},
			{
				name: 'Correct way for "only top/mid/**" (other file in top): *, !top/, top/*, !top/mid/** -> top/other.txt',
				globs: ['*', '!top/', 'top/*', '!top/mid/**'],
				path: 'top/other.txt',
				expected: false // Ignored by 'top/*'
			},


			// --- Другие случаи с порядком (должны работать как раньше, т.к. не нарушают правило о родителях) ---
			{
				name: 'Order matters: !file.md, file.md -> file.md',
				globs: ['!file.md', 'file.md'],
				path: 'file.md',
				expected: false // Ignored by 'file.md' (last rule)
			},

			// --- Случай "только это" (перепроверяем с учетом правила о родителях) ---
			//  Globs: ["*", "!projects/**"], Path: "projects/my/file.md"
			//  '*' excludes 'projects/'. So '!projects/**' cannot re-include contents.
			//  Expected: false
			//  (Этот тест уже был в секции Parent Excluded и остался false)

			// --- Файлы с точкой (dot files/folders) ---
			//  Globs: [".obsidian/", "!.obsidian/config"], Path: ".obsidian/config"
			//  '.obsidian/' excludes parent.
			//  Expected: false
			//  (Этот тест уже был в секции Parent Excluded и остался false)

			// --- "Противоречивые" случаи ---
			{
				name: 'Contradictory 1: !src/**, *.js -> src/subdir/file.js',
				globs: ['!src/**', '*.js'], // !src/** makes src/ not ignored. Then *.js ignores file.js.
				path: 'src/subdir/file.js',
				expected: false
			},
			{
				name: 'Contradictory 1: !src/**, *.js -> src/subdir/file.txt',
				globs: ['!src/**', '*.js'], // !src/** makes src/ not ignored. *.js does not match.
				path: 'src/subdir/file.txt',
				expected: true
			},
			{
				name: 'Contradictory 2: *.js, !src/** -> src/file.js',
				globs: ['*.js', '!src/**'], // *.js ignores src/file.js. !src/** makes src/ (and its contents) not ignored. Last rule wins.
				path: 'src/file.js',
				expected: true
			},
			{
				name: 'Contradictory 2: *.js, !src/** -> lib/file.js',
				globs: ['*.js', '!src/**'], // *.js ignores lib/file.js. !src/** does not match.
				path: 'lib/file.js',
				expected: false
			},

			// --- Только правило на разрешение ---
			{
				name: 'Only allow rule !important.txt: other.txt',
				globs: ['!important.txt'], // No rule ignores other.txt. !important.txt does not match.
				path: 'other.txt',
				expected: true // Not ignored
			},
			{
				name: 'Only allow rule !important.txt: important.txt',
				globs: ['!important.txt'], // !important.txt matches, makes it not ignored.
				path: 'important.txt',
				expected: true // Not ignored
			},
		];

		testCases.forEach(tc => {
			it(`should correctly process: ${tc.name} (path: "${tc.path}", globs: ${JSON.stringify(tc.globs)})`, () => {
				const filter = new FileFilter(createSettings(tc.globs));
				const received = filter.isPathAllowed(tc.path);

				// Логирование только для упавших тестов (убрано из предыдущей версии, т.к. expect сам покажет)
				// if (received !== tc.expected) { ... } 

				expect(received).toBe(tc.expected);
			});
		});
	});
});
