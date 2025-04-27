import { CheckboxSyncPluginSettings } from "src/types";
import { SettingsValidator } from "src/ui/validation/SettingsValidator";

describe('SettingsValidator', () => {
  let validator: SettingsValidator;

  beforeEach(() => {
    validator = new SettingsValidator();
  });

  // Хелпер для создания Partial настроек
  const createSettings = (checked: string[], unchecked: string[], ignore: string[]): Partial<CheckboxSyncPluginSettings> => ({
    checkedSymbols: checked,
    uncheckedSymbols: unchecked,
    ignoreSymbols: ignore,
  });

  test('should return no errors for valid lists with no intersections', () => {
    const settings = createSettings(['x'], [' '], ['-']);
    const errors = validator.validate(settings);
    expect(errors).toEqual([]);
  });

  test('should return no errors for empty ignore list', () => {
    const settings = createSettings(['x'], [' '], []);
    const errors = validator.validate(settings);
    expect(errors).toEqual([]);
  });

  test('should return no errors when lists are missing (treated as empty)', () => {
    const settings: Partial<CheckboxSyncPluginSettings> = { checkedSymbols: ['x'] }; // unchecked и ignore отсутствуют
    const errors = validator.validate(settings);
    expect(errors).toEqual([]);
  });


  test('should return error for intersection between checked and unchecked', () => {
    const settings = createSettings(['x', 'a'], [' ', 'a'], ['-']);
    const errors = validator.validate(settings);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Checked and Unchecked');
    expect(errors[0].message).toContain('["a"]');
  });

  test('should return error for intersection between checked and ignore', () => {
    const settings = createSettings(['x', '-'], [' '], ['-', 'o']);
    const errors = validator.validate(settings);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Checked and Ignore');
    expect(errors[0].message).toContain('["-"]');
  });

  test('should return error for intersection between unchecked and ignore', () => {
    const settings = createSettings(['x'], [' ', '~'], ['-', '~']);
    const errors = validator.validate(settings);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Unchecked and Ignore');
    expect(errors[0].message).toContain('["~"]');
  });

  test('should return multiple errors for multiple intersections', () => {
    const settings = createSettings(['x', 'a'], [' ', 'a'], ['-', 'x']); // a: checked/unchecked, x: checked/ignore
    const errors = validator.validate(settings);
    expect(errors).toHaveLength(2);
    // Проверяем наличие обоих сообщений (порядок может быть разным)
    expect(errors.some(e => e.message.includes('Checked and Unchecked') && e.message.includes('["a"]'))).toBe(true);
    expect(errors.some(e => e.message.includes('Checked and Ignore') && e.message.includes('["x"]'))).toBe(true);
  });

  test('should return all three errors if one symbol intersects all lists', () => {
    const settings = createSettings(['x'], ['x'], ['x']);
    const errors = validator.validate(settings);
    expect(errors).toHaveLength(3);
    expect(errors.some(e => e.message.includes('Checked and Unchecked'))).toBe(true);
    expect(errors.some(e => e.message.includes('Checked and Ignore'))).toBe(true);
    expect(errors.some(e => e.message.includes('Unchecked and Ignore'))).toBe(true);
  });
});