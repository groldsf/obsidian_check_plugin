import { validateValueIsBoolean } from "src/ui/validation/validators";


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

    // --- Сюда можно будет добавлять describe-блоки для других функций валидации ---
    /*
    describe('validateJsonStringArray', () => {
        // ... тесты для валидации JSON ...
    });

    describe('validateNotEmptyArray', () => {
        // ... тесты для проверки на пустой массив ...
    });
    */

});