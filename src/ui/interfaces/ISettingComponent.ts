import { CheckboxSyncPluginSettings } from "src/types";
import { ValidationError } from "../validation/types";


/**
 * Интерфейс для компонента, отвечающего за одну настройку в UI.
 */
export interface ISettingComponent {
  /**
   * Получает ключ настройки, за которую отвечает этот компонент.
   * @returns Ключ из CheckboxSyncPluginSettings.
   */
  getSettingKey(): keyof CheckboxSyncPluginSettings;

  /**
   * Получает значение по умолчанию для этой настройки.
   * @returns Значение по умолчанию.
   */
  getDefaultValue(): any;

  /**
   * Рендерит UI-элементы для этой настройки в указанный контейнер.
   * @param container - HTML-элемент, куда добавлять настройку.
   * @param currentValue - Текущее сохраненное значение настройки.
   */
  render(container: HTMLElement, currentValue: any): void;

  /**
   * Считывает значение из UI-элементов компонента.
   * Может включать парсинг (например, JSON).
   * @returns Текущее значение из UI.
   * @throws Error если значение в UI некорректно для извлечения (например, невалидный JSON).
   */
  getValueFromUi(): any;

  /**
   * Устанавливает значение в UI-элементы компонента.
   * Может включать форматирование (например, JSON.stringify).
   * @param value - Значение для установки в UI.
   */
  setValueInUi(value: any): void;

  /**
   * Выполняет *индивидуальную* валидацию значения.
   * **Важно:** Этот метод должен быть тестируемым и не зависеть от Obsidian API.
   * Он принимает чистое значение и возвращает ошибку или null.
   * @param value - Чистое значение для валидации (обычно результат getValueFromUi).
   * @returns Объект ValidationError, если значение невалидно, иначе null.
   */
  validate(): ValidationError | null;

  /**
   * Устанавливает колбэк, который будет вызван при изменении значения в UI.
   * Используется для управления флагом isDirty.
   * @param listener - Функция обратного вызова.
   */
  setChangeListener(listener: () => void): void;
}