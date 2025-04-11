# Checkbox Sync

[![License: 0BSD](https://img.shields.io/badge/License-0BSD-blue.svg)](LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/groldsf/obsidian_check_plugin)](https://github.com/groldsf/obsidian_check_plugin/releases)
[![Downloads](https://img.shields.io/github/downloads/groldsf/obsidian_check_plugin/total.svg)](https://github.com/groldsf/obsidian_check_plugin/releases)

- [English](#english)
- [Русский](#русский)

## English

### Description

**Checkbox Sync** is a plugin for [Obsidian](https://obsidian.md/) that helps automate the management of checkbox states within hierarchical lists in your notes. It offers bidirectional synchronization options based on your settings:

1.  **Parent state from children:** If enabled, the parent checkbox state automatically reflects the completion status of its children (checked if all children are checked, unchecked otherwise).
2.  **Child state from parent:** If enabled, manually changing a parent checkbox's state will cascade that change down to all its direct and nested children.

This provides flexibility in how you manage your task lists.

**Example 1: Parent state updates from children**

<img src="https://raw.githubusercontent.com/groldsf/obsidian_check_plugin/refs/heads/master/img/showcase.gif" alt="Checking the last child causes the parent to become checked. Unchecking any child unchecks the parent (requires `enableAutomaticParentState` setting)." width="300">

*Checking the last child causes the parent to become checked. Unchecking any child unchecks the parent (requires `enableAutomaticParentState` setting).*

**Example 2: Child state updates from parent**

<img src="https://raw.githubusercontent.com/groldsf/obsidian_check_plugin/refs/heads/master/img/showcase2.gif" alt="Manually checking/unchecking the parent checkbox cascades the state change to all children (requires `enableAutomaticChildState` setting)." width="300">

*Manually checking/unchecking the parent checkbox cascades the state change to all children (requires `enableAutomaticChildState` setting).*

### Supported Lists

The plugin works with both ordered and unordered lists:

-   **Unordered Lists** - Lists created with `-`, `+` or `*` markers
-   **Ordered Lists** - Numbered lists (1., 2., etc.)

The plugin respects list indentation, allowing for nested checkbox hierarchies at any level. It also attempts to handle checkboxes within embedded files (`![[...]]`), though behavior might depend on Obsidian's own handling of embeds.

### Settings

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

### Usage

After activating the plugin, it automatically tracks and synchronizes checkboxes based on your settings, as demonstrated in the examples above. You can enable or disable the upward sync (parent from children) and downward sync (children from parent) independently via the settings to tailor the behavior to your preferred workflow.

### Installation

#### Via Community Plugins (Recommended) 
1. Open Obsidian and go to **Settings → Community plugins**. 
2. Click the **Browse** button, search for "Checkbox Sync", and click **Install**. 
3. Once installed, click **Enable**. 
#### Manual Installation 
1. Go to the [releases page](https://github.com/groldsf/obsidian_check_plugin/releases) and download the latest `main.js`, `manifest.json`, and `styles.css` (if present). 
2. Create a new folder named `checkbox-sync` inside your vault's plugin folder: `<your-vault>/.obsidian/plugins/`. 
3. Copy the downloaded files into the `<your-vault>/.obsidian/plugins/checkbox-sync/` folder. 
4. Restart Obsidian. 
5. Open **Settings → Community plugins**, find **Checkbox Sync** in the list, and enable it.

### Development and Contribution

If you want to make changes or improvements to the plugin:

1.  **Fork** the repository.
2.  Create a new branch:
    `git checkout -b feature/feature-name`
3.  Make changes and commit:
    `git commit -m "Description of changes"`
4.  Push changes to your fork:
    `git push origin feature/feature-name`
5.  Open a Pull Request in the original repository.

### License

This project is licensed under the 0BSD license.

### Acknowledgments

-   [Obsidian](https://obsidian.md/) — a platform for creating and organizing notes.
-   The project is based on the [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin) template.

---

If you have any questions, suggestions, or find a bug, please [create an issue](https://github.com/groldsf/obsidian_check_plugin/issues) in the repository.

## Русский

### Описание

**Checkbox Sync** — это плагин для [Obsidian](https://obsidian.md/), который помогает автоматизировать управление состоянием чекбоксов в иерархических списках ваших заметок. Он предлагает опции двунаправленной синхронизации в соответствии с вашими настройками:

1.  **Состояние родителя от детей:** Если включено, состояние родительского чекбокса автоматически отражает статус выполнения его дочерних элементов (отмечен, если все дочерние отмечены, не отмечен в противном случае).
2.  **Состояние детей от родителя:** Если включено, ручное изменение состояния родительского чекбокса каскадно применит это изменение ко всем его прямым и вложенным дочерним элементам.

Это обеспечивает гибкость в управлении списками задач.

**Пример 1: Состояние родителя обновляется от детей**

<img src="https://raw.githubusercontent.com/groldsf/obsidian_check_plugin/refs/heads/master/img/showcase.gif" alt="Checking the last child causes the parent to become checked. Unchecking any child unchecks the parent (requires `enableAutomaticParentState` setting)." width="300">

*Отметка последнего дочернего чекбокса приводит к отметке родительского. Снятие отметки с любого дочернего элемента снимает отметку с родительского (требует включенной настройки `enableAutomaticParentState`).*

**Пример 2: Состояние детей обновляется от родителя**

<img src="https://raw.githubusercontent.com/groldsf/obsidian_check_plugin/refs/heads/master/img/showcase2.gif" alt="Manually checking/unchecking the parent checkbox cascades the state change to all children (requires `enableAutomaticChildState` setting)." width="300">

*Ручная отметка/снятие отметки с родительского чекбокса каскадно применяет изменение ко всем дочерним элементам (требует включенной настройки `enableAutomaticChildState`).*

### Поддерживаемые списки

Плагин работает как с нумерованными, так и с ненумерованными списками:

-   **Ненумерованные списки** - Списки, созданные с помощью маркеров `-`, `+` или `*`
-   **Нумерованные списки** - Списки с цифровой нумерацией (1., 2. и т.д.)

Плагин учитывает отступы списков, позволяя создавать вложенные иерархии чекбоксов на любом уровне. Он также пытается корректно обрабатывать чекбоксы внутри встроенных файлов (`![[...]]`), хотя поведение может зависеть от собственной обработки встраиваний в Obsidian.

### Настройки

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

### Использование

После активации плагина, он автоматически отслеживает и синхронизирует чекбоксы в соответствии с вашими настройками, как показано в примерах выше. Вы можете независимо включать или отключать синхронизацию вверх (родитель от детей) и вниз (дети от родителя) с помощью настроек, чтобы адаптировать поведение под ваш рабочий процесс.

### Установка

#### Через Плагины сообщества (Рекомендуется) 
1. Откройте Obsidian и перейдите в **Настройки → Плагины сообщества**. 
2. Нажмите кнопку **Обзор**, найдите "Checkbox Sync" и нажмите **Установить**. 
3. После установки нажмите **Включить**. 
#### Ручная установка 
1. Перейдите на [страницу релизов](https://github.com/groldsf/obsidian_check_plugin/releases) и скачайте последние `main.js`, `manifest.json` и `styles.css` (при наличии). 
2. Создайте новую папку с именем `checkbox-sync` в папке плагинов вашего хранилища: `<ваше-хранилище>/.obsidian/plugins/`. 
3. Скопируйте загруженные файлы в папку `<ваше-хранилище>/.obsidian/plugins/checkbox-sync/`. 
4. Перезапустите Obsidian. 
5. Откройте **Настройки → Плагины сообщества**, найдите **Checkbox Sync** в списке и активируйте его.

### Разработка и вклад

Если вы хотите внести изменения или улучшения в плагин:

1.  **Форкните** репозиторий.
2.  Создайте новую ветку:
    `git checkout -b feature/имя-функционала`
3.  Внесите изменения и сделайте коммит:
    `git commit -m "Описание изменений"`
4.  Отправьте изменения в свой форк:
    `git push origin feature/имя-функционала`
5.  Откройте Pull Request в оригинальном репозитории.

### Лицензия

Этот проект лицензирован под лицензией 0BSD.

### Благодарности

-   [Obsidian](https://obsidian.md/) — платформа для создания и организации заметок.
-   Проект создан на основе шаблона [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin).

---

Если у вас есть вопросы, предложения или вы обнаружили баг, пожалуйста, [создайте issue](https://github.com/groldsf/obsidian_check_plugin/issues) в репозитории.