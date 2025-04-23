// Добавляем Modal в импорты из 'obsidian'
import { App, Modal, Setting } from "obsidian";

// --- НОВЫЙ КОД: Класс ConfirmModal ---
export class ConfirmModal extends Modal {
  message: string;
  onConfirm: () => void; // Синхронный колбэк

  constructor(app: App, message: string, onConfirm: () => void) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty(); // Очищаем на всякий случай
    contentEl.createEl('p').setText(this.message);

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Cancel')
          .onClick(() => {
            this.close();
          }))
      .addButton((btn) =>
        btn
          .setButtonText('OK') // Или "Confirm", "Yes"
          .setCta()
          .onClick(() => {
            this.close();
            this.onConfirm(); // Вызываем колбэк
          }));
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
// --- КОНЕЦ ConfirmModal ---

// --- НОВЫЙ КОД: Класс InfoModal ---
export class InfoModal extends Modal {
  message: string;

  constructor(app: App, message: string) {
    super(app);
    this.message = message;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    // Используем <pre> для сохранения форматирования ошибки
    const pre = contentEl.createEl('pre');
    pre.setText(this.message);
    pre.style.whiteSpace = 'pre-wrap'; // Для переноса строк

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('OK')
          .setCta()
          .onClick(() => {
            this.close();
          }));
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
// --- КОНЕЦ InfoModal ---

// --- НОВЫЙ КОД: Класс SaveConfirmModal ---
export class SaveConfirmModal extends Modal {
  onSave: () => Promise<void>; // Асинхронный колбэк для сохранения
  onDiscard: () => void;

  constructor(app: App, onSave: () => Promise<void>, onDiscard: () => void) {
    super(app);
    this.onSave = onSave;
    this.onDiscard = onDiscard;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.setText('You have unsaved changes. Save them before closing?');

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Discard')
          .onClick(() => {
            this.close();
            this.onDiscard();
          }))
      .addButton((btn) =>
        btn
          .setButtonText('Save')
          .setCta()
          .onClick(async () => {
            btn.setDisabled(true).setButtonText('Saving...');
            try {
              await this.onSave();
              this.close();
            } catch (e) {
              console.error("Unexpected error during save callback:", e);
              new InfoModal(this.app, "An unexpected error occurred during save.").open();
              this.close(); // Закрываем в любом случае после ошибки
            } finally {
              // Восстанавливаем кнопку на случай если модалка не закроется (не должно быть)
              btn.setDisabled(false).setButtonText('Save');
            }
          }));
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}