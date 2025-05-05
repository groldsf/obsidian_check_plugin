// src/settings/validation/validators.ts

import { CheckboxState } from "src/types";

/**
 * Проверяет, является ли предоставленное значение булевым типом (boolean).
 * Эта функция не зависит от контекста Obsidian или конкретного компонента.
 *
 * @param value - Значение любого типа для проверки.
 * @returns Объект с сообщением об ошибке, если значение не является boolean, иначе null.
 */
export function validateValueIsBoolean(value: any): { message: string } | null {
  if (typeof value !== 'boolean') {
    return { message: 'Value must be a boolean.' };
  }
  return null;
}

/**
 * Проверяет, является ли значение допустимым состоянием CheckboxState.
 * @param value Значение для проверки.
 * @returns Объект с сообщением об ошибке, если значение недопустимо, иначе null.
 */
export function validateIsCheckboxState(value: any): { message: string } | null {
  // Получаем все возможные значения из enum CheckboxState
  const validStates = Object.values(CheckboxState);
  if (validStates.includes(value as CheckboxState)) {
    return null; // Значение допустимо
  } else {
    return { message: `Invalid checkbox state selected. Must be one of: ${validStates.join(', ')}.` };
  }
}

/**
 * Проверяет, является ли строка валидным JSON-массивом строк,
 * где каждая строка состоит ровно из одного символа.
 * Также проверяет на уникальность символов.
 * @param rawJson Строка для проверки.
 * @returns Объект с сообщением об ошибке, если невалидно, иначе null.
 */
export function validateJsonStringArray(rawJson: string | null | undefined): { message: string } | null {
  if (rawJson == null || typeof rawJson !== 'string') {
    return { message: "Input must be a string." }; // Или можно вернуть null, если пустая строка допустима как пустой массив? Зависит от требований.
  }
  const trimmedValue = rawJson.trim();
  // Считаем пустую строку валидным представлением пустого массива []
  if (trimmedValue === '' || trimmedValue === '[]') {
    return null;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(trimmedValue);
  } catch (e: any) {
    return { message: `Invalid JSON format: ${e.message}` };
  }

  if (!Array.isArray(parsed)) {
    return { message: "Invalid format: Input must be a valid JSON array (e.g., [\"x\", \" \"])." };
  }

  const symbols = new Set<string>();
  for (let i = 0; i < parsed.length; i++) {
    const element = parsed[i];
    if (typeof element !== 'string') {
      return { message: `Invalid content: Array element at index ${i} is not a string.` };
    }
    if (element.length !== 1) {
      return { message: `Invalid content: Element "${element}" at index ${i} must be a single character.` };
    }
    if (symbols.has(element)) {
      return { message: `Invalid content: Duplicate symbol "${element}" found.` };
    }
    symbols.add(element);
  }

  return null; // Все проверки пройдены
}


/**
* Проверяет, является ли предоставленный массив непустым.
* @param arr Массив для проверки.
* @returns Объект с сообщением об ошибке, если массив пуст или не является массивом, иначе null.
*/
export function validateNotEmptyArray(arr: any): { message: string } | null {
  // Добавим проверку, что это действительно массив
  if (!Array.isArray(arr)) {
    return { message: 'Value must be an array.' }; // Ошибка типа данных
  }
  if (arr.length === 0) {
    return { message: 'The list cannot be empty.' };
  }
  return null;
}