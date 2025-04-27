import { CheckboxState } from "src/types";
import { validateIsCheckboxState, validateJsonStringArray, validateNotEmptyArray, validateValueIsBoolean } from "src/ui/validation/validators";


// Группа тестов для всего файла валидаторов
describe('Validation Utility Functions', () => {

    // Подгруппа тестов для конкретной функции validateValueIsBoolean
    describe('validateValueIsBoolean', () => {

        // Тест кейсы для валидных значений (должны возвращать null)
        test('should return null for true', () => {
            expect(validateValueIsBoolean(true)).toBeNull();
        });

        test('should return null for false', () => {
            expect(validateValueIsBoolean(false)).toBeNull();
        });

        // Тест кейсы для невалидных значений (должны возвращать объект ошибки)
        test('should return error object for null', () => {
            const expectedError = { message: 'Value must be a boolean.' };
            expect(validateValueIsBoolean(null)).toEqual(expectedError);
        });

        test('should return error object for undefined', () => {
            const expectedError = { message: 'Value must be a boolean.' };
            expect(validateValueIsBoolean(undefined)).toEqual(expectedError);
        });

        test('should return error object for numbers', () => {
            const expectedError = { message: 'Value must be a boolean.' };
            expect(validateValueIsBoolean(0)).toEqual(expectedError);
            expect(validateValueIsBoolean(1)).toEqual(expectedError);
            expect(validateValueIsBoolean(123)).toEqual(expectedError);
            expect(validateValueIsBoolean(-10)).toEqual(expectedError);
        });

        test('should return error object for strings', () => {
            const expectedError = { message: 'Value must be a boolean.' };
            expect(validateValueIsBoolean('')).toEqual(expectedError);
            expect(validateValueIsBoolean('true')).toEqual(expectedError);
            expect(validateValueIsBoolean('false')).toEqual(expectedError);
            expect(validateValueIsBoolean('any string')).toEqual(expectedError);
        });

        test('should return error object for objects', () => {
            const expectedError = { message: 'Value must be a boolean.' };
            expect(validateValueIsBoolean({})).toEqual(expectedError);
            expect(validateValueIsBoolean({ a: 1 })).toEqual(expectedError);
        });

        test('should return error object for arrays', () => {
            const expectedError = { message: 'Value must be a boolean.' };
            expect(validateValueIsBoolean([])).toEqual(expectedError);
            expect(validateValueIsBoolean([true])).toEqual(expectedError);
        });
    });

    describe('validateIsCheckboxState', () => {
        it('should return null for valid CheckboxState values', () => {
            expect(validateIsCheckboxState(CheckboxState.Checked)).toBeNull();
            expect(validateIsCheckboxState(CheckboxState.Unchecked)).toBeNull();
            expect(validateIsCheckboxState(CheckboxState.Ignore)).toBeNull();
        });

        it('should return error object for invalid values', () => {
            const expectedError = { message: `Invalid checkbox state selected. Must be one of: ${Object.values(CheckboxState).join(', ')}.` };
            expect(validateIsCheckboxState('checked ')).toEqual(expectedError); // Лишний пробел
            expect(validateIsCheckboxState('CHECKED')).toEqual(expectedError); // Не тот регистр
            expect(validateIsCheckboxState(null)).toEqual(expectedError);
            expect(validateIsCheckboxState(undefined)).toEqual(expectedError);
            expect(validateIsCheckboxState(1)).toEqual(expectedError);
            expect(validateIsCheckboxState({})).toEqual(expectedError);
            expect(validateIsCheckboxState('')).toEqual(expectedError);
        });
    });

    describe('validateJsonStringArray', () => {
        // Валидные случаи
        test('should return null for valid single-element array', () => {
            expect(validateJsonStringArray('["x"]')).toBeNull();
            expect(validateJsonStringArray('[" "]')).toBeNull();
        });

        test('should return null for valid multi-element array', () => {
            expect(validateJsonStringArray('["x", " ", "✓"]')).toBeNull();
        });

        test('should return null for empty array string "[]"', () => {
            expect(validateJsonStringArray('[]')).toBeNull();
        });

        test('should return null for empty string ""', () => {
            // Мы решили, что пустая строка - валидный пустой массив
            expect(validateJsonStringArray('')).toBeNull();
        });

         test('should return null for string with whitespace around valid JSON', () => {
            expect(validateJsonStringArray('  ["x", "o"]  ')).toBeNull();
        });


        // Невалидные случаи: Не JSON
        test('should return error for non-JSON string', () => {
            expect(validateJsonStringArray('["x"')).toEqual({ message: expect.stringContaining('JSON format') });
            expect(validateJsonStringArray('abc')).toEqual({ message: expect.stringContaining('JSON format') });
            expect(validateJsonStringArray('[x]')).toEqual({ message: expect.stringContaining('JSON format') }); // 'x' должен быть в кавычках
        });

         // Невалидные случаи: Не массив
        test('should return error for valid JSON that is not an array', () => {
            expect(validateJsonStringArray('{"a": 1}')).toEqual({ message: expect.stringContaining('must be a valid JSON array') });
            expect(validateJsonStringArray('"string"')).toEqual({ message: expect.stringContaining('must be a valid JSON array') });
            expect(validateJsonStringArray('123')).toEqual({ message: expect.stringContaining('must be a valid JSON array') });
            expect(validateJsonStringArray('null')).toEqual({ message: expect.stringContaining('must be a valid JSON array') });
        });

        // Невалидные случаи: Содержимое массива - не строки
        test('should return error if array contains non-string elements', () => {
            expect(validateJsonStringArray('[1]')).toEqual({ message: expect.stringContaining('not a string') });
            expect(validateJsonStringArray('["x", 2]')).toEqual({ message: expect.stringContaining('not a string') });
            expect(validateJsonStringArray('[null]')).toEqual({ message: expect.stringContaining('not a string') });
            expect(validateJsonStringArray('[[]]')).toEqual({ message: expect.stringContaining('not a string') });
        });

        // Невалидные случаи: Строки не из одного символа
        test('should return error if array contains strings of incorrect length', () => {
            expect(validateJsonStringArray('["xx"]')).toEqual({ message: expect.stringContaining('must be a single character') });
            expect(validateJsonStringArray('["x", "ab"]')).toEqual({ message: expect.stringContaining('must be a single character') });
            expect(validateJsonStringArray('[""]')).toEqual({ message: expect.stringContaining('must be a single character') }); // Пустая строка тоже не 1 символ
        });

         // Невалидные случаи: Дубликаты символов
         test('should return error if array contains duplicate symbols', () => {
             expect(validateJsonStringArray('["x", "x"]')).toEqual({ message: expect.stringContaining('Duplicate symbol "x"') });
             expect(validateJsonStringArray('["a", "b", "a"]')).toEqual({ message: expect.stringContaining('Duplicate symbol "a"') });
         });

        // Невалидные случаи: Null или undefined на входе
        test('should return error for null or undefined input', () => {
             expect(validateJsonStringArray(null)).toEqual({ message: "Input must be a string." });
             expect(validateJsonStringArray(undefined)).toEqual({ message: "Input must be a string." });
         });
    });

    describe('validateNotEmptyArray', () => {
        // Валидные случаи (не пустой массив)
        test('should return null for non-empty arrays', () => {
            expect(validateNotEmptyArray(['a'])).toBeNull();
            expect(validateNotEmptyArray([1, 2])).toBeNull();
            expect(validateNotEmptyArray([null])).toBeNull();
            expect(validateNotEmptyArray([undefined])).toBeNull();
            expect(validateNotEmptyArray([[]])).toBeNull(); // Массив, содержащий пустой массив
        });

        // Невалидные случаи: Пустой массив
        test('should return error object for an empty array', () => {
            expect(validateNotEmptyArray([])).toEqual({ message: 'The list cannot be empty.' });
        });

        // Невалидные случаи: Не массив
        test('should return error object for non-array values', () => {
            const expectedError = { message: 'Value must be an array.' };
            expect(validateNotEmptyArray(null)).toEqual(expectedError);
            expect(validateNotEmptyArray(undefined)).toEqual(expectedError);
            expect(validateNotEmptyArray('abc')).toEqual(expectedError);
            expect(validateNotEmptyArray(123)).toEqual(expectedError);
            expect(validateNotEmptyArray({})).toEqual(expectedError);
        });
    });

});