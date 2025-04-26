import { Setting } from 'obsidian';
import { CheckboxSyncPluginSettings } from '../../types';
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
    abstract getDefaultValue(): any;
    // render теперь должен сам создавать Setting и сохранять ссылку в this.setting
    abstract render(container: HTMLElement, currentValue: any): void;
    abstract getValueFromUi(): any;
    abstract setValueInUi(value: any): void;
    abstract validate(value: any): ValidationError | null;

    // --- Общая реализация ---
    public setChangeListener(listener: () => void): void {
        this.onChangeCallback = listener;
    }
}