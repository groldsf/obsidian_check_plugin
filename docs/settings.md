---
title: Settings
nav_order: 2
---
# Settings

- [English](#english)
- [Русский](#русский)

## English

The plugin offers the following configuration options, accessible via Obsidian's settings panel.

### Checkbox Symbol Configuration (Advanced: JSON)

This section allows for fine-grained control over how different symbols within checkboxes `[ ]` are interpreted by the plugin. **Note:** These settings replace the previous, simpler "X-Only Mode".

**Warning:** The symbol lists require valid JSON array format. Use double quotes for strings within the array (e.g., `["x", " "]`). Invalid JSON may cause errors.

-   **Checked Symbols**
    -   **Description:** Define symbols that should be treated as "checked". Enter symbols as a JSON array of single-character strings.
    -   **Example:** `["x", "✓", "/"]`
    -   **Default:** `["x"]`
-   **Unchecked Symbols**
    -   **Description:** Define symbols that should be treated as "unchecked". Enter symbols as a JSON array of single-character strings.
    -   **Example:** `[" ", "?"]`
    -   **Default:** `[" "]`
-   **Ignore Symbols**
    -   **Description:** Define symbols that should be completely ignored by the plugin's synchronization logic. Checkboxes with these symbols will not be modified by parent/child updates, nor will they influence the parent's state. Enter symbols as a JSON array of single-character strings.
    -   **Example:** `["-", "~"]`
    -   **Default:** `[]`
-   **Unknown Symbol Policy**
    -   **Description:** Determines how to treat checkbox symbols that are not explicitly listed in the Checked, Unchecked, or Ignore lists.
    -   **Options:**
        -   `Treat as Checked`: Unknown symbols count as checked.
        -   `Treat as Unchecked`: Unknown symbols count as unchecked.
        -   `Ignore`: Unknown symbols are ignored (like those in the Ignore Symbols list).
    -   **Default:** `Treat as Unchecked`

### Synchronization Behavior

These settings control when and how the synchronization logic runs.

-   **Update parent checkbox state automatically**
    -   **Enabled (Default):** The state of a parent checkbox is automatically updated based on the state of its children (checked if all applicable children are checked, unchecked otherwise).
    -   **Disabled:** The parent checkbox state is not automatically changed when child states change. Manual changes to a parent *can* still affect children if the setting below is enabled.
-   **Update child checkbox state automatically**
    -   **Enabled (Default):** Manually changing the state of a parent checkbox automatically updates the state of all its direct and nested children (that are not ignored) to match.
    -   **Disabled:** Manually changing a parent checkbox does not affect its children's state.
-   **Enable automatic file synchronization**
    -   **Enabled:** Automatically synchronizes checkbox states when files are loaded/opened and immediately after plugin settings are applied. This ensures consistency but might have performance implications on very large vaults or files. *(Requires Obsidian restart or settings reload to take full effect)*.
    -   **Disabled (Default):** Synchronization only occurs when you *manually* change a checkbox's state within Obsidian. This is the default behavior to minimize potential performance impact.

### Actions and Status

-   **Error Display:** An area below the settings displays any errors encountered, such as invalid JSON in the symbol configuration.
-   **Buttons:**
    -   `Apply Changes`: Saves and applies any modified settings. Enabled only when changes are detected.
    -   `Reset changes`: Reverts any modifications back to the last applied settings state.
    -   `Reset to defaults`: Resets all settings to their default values and applies them immediately.

---

## Русский

Плагин предлагает следующие параметры конфигурации, доступные через панель настроек Obsidian.

### Конфигурация Символов Чекбоксов (Продвинутый: JSON)

Этот раздел позволяет детально настроить, как плагин интерпретирует различные символы внутри чекбоксов `[ ]`. **Примечание:** Эти настройки заменяют предыдущий, более простой режим "X-Only".

**Предупреждение:** Списки символов требуют валидного формата JSON-массива. Используйте двойные кавычки для строк внутри массива (например, `["x", " "]`). Невалидный JSON может вызвать ошибки.

-   **Символы "Отмечено" (Checked Symbols)**
    -   **Описание:** Определите символы, которые должны считаться "отмеченными". Введите символы как JSON-массив строк из одного символа.
    -   **Пример:** `["x", "✓", "/"]`
    -   **По умолчанию:** `["x"]`
-   **Символы "Не отмечено" (Unchecked Symbols)**
    -   **Описание:** Определите символы, которые должны считаться "не отмеченными". Введите символы как JSON-массив строк из одного символа.
    -   **Пример:** `[" ", "?"]`
    -   **По умолчанию:** `[" "]`
-   **Игнорируемые Символы (Ignore Symbols)**
    -   **Описание:** Определите символы, которые должны полностью игнорироваться логикой синхронизации плагина. Чекбоксы с этими символами не будут изменяться при обновлении родителя/детей и не будут влиять на состояние родителя. Введите символы как JSON-массив строк из одного символа.
    -   **Пример:** `["-", "~"]`
    -   **По умолчанию:** `[]`
-   **Политика для Неизвестных Символов (Unknown Symbol Policy)**
    -   **Описание:** Определяет, как обрабатывать символы в чекбоксах, которые явно не указаны в списках "Отмечено", "Не отмечено" или "Игнорируемые".
    -   **Опции:**
        -   `Treat as Checked` (Считать отмеченным): Неизвестные символы считаются отмеченными.
        -   `Treat as Unchecked` (Считать не отмеченным): Неизвестные символы считаются не отмеченными.
        -   `Ignore` (Игнорировать): Неизвестные символы игнорируются (как те, что в списке "Игнорируемые Символы").
    -   **По умолчанию:** `Treat as Unchecked`

### Поведение Синхронизации

Эти настройки управляют тем, когда и как запускается логика синхронизации.

-   **Автоматически обновлять состояние родительского чекбокса**
    -   **Включено (По умолчанию):** Состояние родительского чекбокса автоматически обновляется на основе состояния дочерних (отмечен, если все применимые дочерние отмечены, не отмечен в противном случае).
    -   **Отключено:** Состояние родительского чекбокса не изменяется автоматически при изменении состояния дочерних. Ручные изменения родителя *могут* влиять на дочерние, если включена настройка ниже.
-   **Автоматически обновлять состояние дочерних чекбоксов**
    -   **Включено (По умолчанию):** Ручное изменение состояния родительского чекбокса автоматически обновляет состояние всех его прямых и вложенных дочерних элементов (которые не игнорируются).
    -   **Отключено:** Ручное изменение родительского чекбокса не влияет на состояние его дочерних элементов.
-   **Включить автоматическую синхронизацию файлов**
    -   **Включено:** Автоматически синхронизирует состояния чекбоксов при загрузке/открытии файлов и сразу после применения настроек плагина. Это обеспечивает консистентность, но может влиять на производительность в очень больших хранилищах или файлах. *(Требует перезапуска Obsidian или перезагрузки настроек для полного вступления в силу)*.
    -   **Отключено (По умолчанию):** Синхронизация происходит только тогда, когда вы *вручную* изменяете состояние чекбокса в Obsidian. Это поведение по умолчанию для минимизации потенциального влияния на производительность.

### Действия и Статус

-   **Отображение Ошибок:** Область под настройками отображает любые возникшие ошибки, например, невалидный JSON в конфигурации символов.
-   **Кнопки:**
    -   `Apply Changes` (Применить изменения): Сохраняет и применяет измененные настройки. Активна только при наличии изменений.
    -   `Reset changes` (Отменить изменения): Возвращает несохраненные изменения к последнему примененному состоянию настроек.
    -   `Reset to defaults` (Сбросить по умолчанию): Сбрасывает все настройки к значениям по умолчанию и немедленно применяет их.