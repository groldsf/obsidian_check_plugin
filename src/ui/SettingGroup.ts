import { CheckboxSyncPluginSettings } from "src/types";
import { ISettingComponent } from "./interfaces/ISettingComponent";

/**
 * Представляет группу связанных настроек в UI.
 */
export class SettingGroup {
  title: string;
  description?: string;
  components: ISettingComponent[];

  /**
   * Создает экземпляр группы настроек.
   * @param title - Заголовок группы (отображается как h3).
   * @param components - Массив компонентов настроек, входящих в эту группу.
   * @param description - Опциональное описание группы (отображается как p).
   */
  constructor(title: string, components: ISettingComponent[], description?: string) {
    this.title = title;
    this.components = components;
    this.description = description;
  }

  /**
   * Рендерит заголовок группы и все ее компоненты.
   * @param container - HTML-элемент, куда рендерить группу.
   * @param currentSettings - Объект текущих настроек плагина.
   */
  render(container: HTMLElement, currentSettings: CheckboxSyncPluginSettings): void {
    container.createEl('h3', { text: this.title });
    if (this.description) {
      container.createEl('p', { text: this.description, cls: 'setting-item-description' });
    }

    // Рендерим каждый компонент, передавая ему текущее значение
    for (const component of this.components) {
      try {
        const key = component.getSettingKey();
        // Проверяем, существует ли ключ в настройках, чтобы избежать ошибок
        if (key in currentSettings) {
          component.render(container, currentSettings[key]);
        } else {
          console.warn(`Setting key "${key}" not found in current settings for component in group "${this.title}". Rendering with default or undefined value might occur.`);
          // Можно передать undefined или значение по умолчанию, если getSettingKey гарантированно работает
          // component.render(container, component.getDefaultValue());
          component.render(container, undefined); // Или рендерить с undefined
        }

      } catch (error) {
        console.error(`Error rendering component for key "${component.getSettingKey()}" in group "${this.title}":`, error);
        // Можно добавить placeholder или сообщение об ошибке в UI
        container.createDiv({ text: `Error rendering setting: ${component.getSettingKey()}`, cls: 'checkbox-sync-settings-error' });
      }
    }
  }
}