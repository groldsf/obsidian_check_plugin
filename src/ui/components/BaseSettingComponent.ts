import { Setting } from 'obsidian';
import { CheckboxSyncPluginSettings, DEFAULT_SETTINGS } from '../../types';
import { ISettingComponent } from '../interfaces/ISettingComponent';
import { ValidationError } from '../validation/types';
// Убрали App и CheckboxSyncPlugin из импортов, если они не нужны ВСЕМ наследникам

export abstract class BaseSettingComponent implements ISettingComponent {
    protected setting: Setting; // Инициализируется в render конкретного компонента
    protected onChangeCallback: () => void = () => {};

    // Конструктор теперь пустой или с минимальными общими зависимостями
    constructor() {}

    // --- Методы для реализации наследниками ---
    abstract getSettingKey(): keyof CheckboxSyncPluginSettings;
    // render теперь должен сам создавать Setting и сохранять ссылку в this.setting
    abstract render(container: HTMLElement, currentValue: any): void;
    abstract getValueFromUi(): any;
    abstract setValueInUi(value: any): void;
    abstract validate(): ValidationError | null;


    public getDefaultValue(): any {
      const key = this.getSettingKey(); // Получаем ключ от наследника
      if (key in DEFAULT_SETTINGS) {
          // Возвращаем значение из импортированного объекта
          return DEFAULT_SETTINGS[key];
      } else {
          // Логируем предупреждение, если ключ не найден (ошибка конфигурации)
          console.warn(
              `[${this.constructor.name}] Default value for key "${key}" not found in DEFAULT_SETTINGS. Returning undefined.`
          );
          return undefined; // Или null, или выбросить ошибку, но undefined безопаснее
      }
  }
    // --- Общая реализация ---
    public setChangeListener(listener: () => void): void {
        this.onChangeCallback = listener;
    }
}