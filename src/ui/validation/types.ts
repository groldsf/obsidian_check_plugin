import { CheckboxSyncPluginSettings } from "src/types";

export interface ValidationError {
  /** Ключ поля настройки, с которым связана ошибка (опционально). */
  field?: keyof CheckboxSyncPluginSettings;
  /** Сообщение об ошибке, понятное пользователю. */
  message: string;
}