import { ValidationError } from "./validation/types";

/**
 * Отвечает за создание, стилизацию и обновление
 * элемента для отображения ошибок валидации настроек.
 */
export class ErrorDisplay {
  private errorElement: HTMLElement;

  /**
   * Создает и стилизует элемент для отображения ошибок внутри контейнера.
   * @param container - Родительский HTML-элемент.
   */
  constructor(container: HTMLElement) {
    this.errorElement = container.createDiv({ cls: 'checkbox-sync-settings-error' });
    this.applyStyles();
  }

  /**
   * Применяет стили к элементу ошибок.
   */
  private applyStyles(): void {
    // Используем стандартные CSS переменные Obsidian для цвета ошибки
    this.errorElement.style.color = 'var(--text-error)';
    this.errorElement.style.marginTop = '10px';
    this.errorElement.style.marginBottom = '10px';
    this.errorElement.style.minHeight = '1.5em'; // Резервируем место
    this.errorElement.style.whiteSpace = 'pre-wrap'; // Для переноса длинных ошибок
    this.errorElement.style.userSelect = 'text'; // Позволяет выделять текст ошибки
  }

  /**
   * Отображает список ошибок валидации.
   * @param errors - Массив объектов ValidationError.
   */
  public displayErrors(errors: ValidationError[]): void {
    if (errors && errors.length > 0) {
      const errorMessage = errors
        .map(e => `❌ ${e.field ? `[${e.field}]: ` : ''}${e.message}`)
        .join('\n');
      this.errorElement.setText(errorMessage); // Используем setText для безопасности
    } else {
      this.clear(); // Если массив пуст или null/undefined, очищаем
    }
  }

  /**
   * Отображает одно общее сообщение об ошибке.
   * @param message - Строка с сообщением.
   */
  public displayMessage(message: string): void {
    if (message) {
      // Добавляем значок ошибки для консистентности
      this.errorElement.setText(`❌ ${message}`);
    } else {
      this.clear();
    }
  }


  /**
   * Очищает элемент отображения ошибок.
   */
  public clear(): void {
    this.errorElement.setText('');
  }
}