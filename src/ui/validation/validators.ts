// src/settings/validation/validators.ts

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

// --- Сюда в будущем можно будет добавлять другие чистые функции валидации ---

/*
// Пример для будущей валидации JSON-массива строк
export function validateJsonStringArray(rawJson: string): { message: string } | null {
  try {
      const parsed = JSON.parse(rawJson);
      if (!Array.isArray(parsed)) {
          return { message: 'Input must be a valid JSON array (e.g., ["x", " "]).' };
      }
      for (let i = 0; i < parsed.length; i++) {
          const element = parsed[i];
          if (typeof element !== 'string') {
               return { message: `Array element at index ${i} is not a string.` };
          }
          if (element.length !== 1) {
               return { message: `Element "${element}" at index ${i} must be a single character.` };
          }
      }
      return null; // Все проверки пройдены
  } catch (e: any) {
      return { message: `Invalid JSON format: ${e.message}` };
  }
}

// Пример для проверки, что массив не пустой
export function validateNotEmptyArray(arr: any[]): { message: string } | null {
  if (!Array.isArray(arr) || arr.length === 0) {
      return { message: 'The list cannot be empty.' };
  }
  return null;
}
*/