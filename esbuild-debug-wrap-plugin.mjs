import { promises } from "fs";

/**
 * Плагин esbuild для обертывания вызовов console.* в условие.
 * @param {object} options
 * @param {string} [options.debugFlagName='DEBUG_WRAP_CONSOLE_PLUGIN_FLAG'] - Имя глобальной переменной для проверки.
 * @param {string[]} [options.methods=['log', 'warn', 'info', 'debug', 'error']] - Методы console, которые нужно обернуть.
 * @returns {import('esbuild').Plugin}
 */
export const debugWrapConsolePlugin = ({
	debugFlagName = "DEBUG_WRAP_CONSOLE_PLUGIN_FLAG", // Имя глобального флага (лучше сделать уникальным для вашего плагина)
	methods = ["log", "warn", "info", "debug", "error"], // Какие методы console оборачивать
} = {}) => ({
	name: "debug-wrap-console",
	setup(build) {
		// Создаем фильтр для методов console
		const methodsPattern = methods.join("|");
		// Регулярное выражение для поиска вызовов console.method(...)
		// Оно пытается обработать простые случаи, но может быть неидеальным для сложных вложенных выражений или многострочных вызовов.
		// $& в замене представляет всю совпавшую строку.
		const consoleRegex = new RegExp(
			// Match 'console.' followed by one of the specified methods
			`(^|\\s+|\\{|\\;)(console\\.(${methodsPattern}))\\s*\\(` +
				// Match arguments (non-greedy) - this is the tricky part and might not capture perfectly balanced parentheses in all complex cases
				`([\\s\\S]*?)` +
				// Match the closing parenthesis and optional semicolon
				`\\)(;?)`,
			"g" // Global search
		);

		const wrapperStart = `if (window.${debugFlagName}) { `;
		const wrapperEnd = ` }`;

		// Перехватываем загрузку JS/TS файлов
		build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
			try {
				// Читаем содержимое файла
				const source = await promises.readFile(args.path, "utf8");

				// Заменяем вызовы console.*
				const contents = source.replace(
					consoleRegex,
					(match, prefix, fullCall, methodName, argsContent, semicolon) => {
						// prefix: Пробел, начало строки, {, ; перед вызовом console
						// fullCall: Сам вызов, например, console.log
						// methodName: Имя метода, например, log
						// argsContent: Содержимое скобок
						// semicolon: Завершающая точка с запятой (если была)

						// Собираем обернутый вызов
						// Мы используем 'match' целиком, чтобы сохранить оригинальное форматирование и содержимое,
						// но убираем исходный префикс (пробел/начало строки/итд) и добавляем его перед if.
						const originalCall = match.substring(prefix.length);
						return `${prefix}${wrapperStart}${originalCall}${wrapperEnd}`;
					}
				);

				// Возвращаем измененное содержимое и указываем esbuild,
				// что это все еще JS/TS код (в зависимости от исходного файла)
				const loader =
					args.path.endsWith(".ts") || args.path.endsWith(".tsx") ? "ts" : "js";

				return {
					contents,
					loader,
				};
			} catch (error) {
				console.error(
					`Error processing file ${args.path} in debug-wrap-console plugin:`,
					error
				);
				// В случае ошибки возвращаем null или выбрасываем ошибку, чтобы сборка прервалась
				return null;
			}
		});
	},
});

