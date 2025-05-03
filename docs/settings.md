# Settings

- [English](#english)
- [Русский](#русский)

## English

The plugin offers the following configuration options:

-   **X-Only Mode**
    -   **Enabled:** Only checkboxes marked with `x` (e.g., `- [x]`) are considered checked.
    -   **Disabled:** Any character inside the checkbox (except a space) marks it as checked (e.g., `- [-]`, `- [?]`).
-   **Update parent checkbox state automatically** (`enableAutomaticParentState`)
    -   **Enabled (Default):** The state of a parent checkbox is automatically updated based on the state of its children (checked if all children are checked, unchecked otherwise).
    -   **Disabled:** The parent checkbox state is not automatically changed when child states change.
-   **Update child checkbox state automatically** (`enableAutomaticChildState`)
    -   **Enabled (Default):** Manually changing the state of a parent checkbox automatically updates the state of all its direct and nested children to match.
    -   **Disabled:** Manually changing a parent checkbox does not affect its children's state.

---

## Русский

Плагин предлагает следующие параметры конфигурации:

-   **Режим X-Only**
    -   **Включен:** Только чекбоксы, отмеченные символом `x` (например, `- [x]`), считаются выполненными.
    -   **Отключен:** Любой символ внутри чекбокса (кроме пробела) считается отметкой о выполнении (например, `- [-]`, `- [?]`).
-   **Автоматически обновлять состояние родительского чекбокса** (`enableAutomaticParentState`)
    -   **Включено (По умолчанию):** Состояние родительского чекбокса автоматически обновляется на основе состояния дочерних (отмечен, если все дочерние отмечены, не отмечен в противном случае).
    -   **Отключено:** Состояние родительского чекбокса не изменяется автоматически при изменении состояния дочерних.
-   **Автоматически обновлять состояние дочерних чекбоксов** (`enableAutomaticChildState`)
    -   **Включено (По умолчанию):** Ручное изменение состояния родительского чекбокса автоматически обновляет состояние всех его прямых и вложенных дочерних элементов.
    -   **Отключено:** Ручное изменение родительского чекбокса не влияет на состояние его дочерних элементов.