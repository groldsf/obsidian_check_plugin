
# Checkbox Sync

[![License: 0BSD](https://img.shields.io/badge/License-0BSD-blue.svg)](LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/groldsf/obsidian_check_plugin)](https://github.com/groldsf/obsidian_check_plugin/releases)

- [English](#english)
- [Русский](#русский)

## English

### Description

**Checkbox Sync** is a plugin for [Obsidian](https://obsidian.md/) that automates the management of checkbox states in your notes. If all child checkboxes are checked, the plugin automatically checks the parent checkbox, and if at least one of them is unchecked, it unchecks the parent.

### Usage

After activating the plugin, it automatically tracks checkboxes in your notes. Example usage:

![](https://raw.githubusercontent.com/groldsf/obsidian_check_plugin/refs/heads/master/img/showcase.gif)

In this example, as soon as both child checkboxes are checked, the plugin will automatically check the parent checkbox. If at least one child checkbox is unchecked, the parent will be unchecked.
### Installation

#### Manual Installation

1. Go to the [releases page](https://github.com/groldsf/obsidian_check_plugin/releases) and download the latest plugin archive.
2. Extract the archive to the directory:  
   `<your-vault>/.obsidian/plugins/checkbox-sync`
3. Restart Obsidian.
4. Open **Settings → Community plugins** and enable **Checkbox Sync**.

#### Installation via Plugin Manager (if supported)

1. Open Obsidian and go to **Settings → Community plugins**.
2. Click the **Browse** button, search for "Checkbox Sync", and install it.
3. Enable the plugin after installation.

### Development and Contribution

If you want to make changes or improvements to the plugin:

1. **Fork** the repository.
2. Create a new branch:  
   `git checkout -b feature/feature-name`
3. Make changes and commit:  
   `git commit -m "Description of changes"`
4. Push changes to your fork:  
   `git push origin feature/feature-name`
5. Open a Pull Request in the original repository.

### License

This project is licensed under the 0BSD license.

### Acknowledgments

- [Obsidian](https://obsidian.md/) — a platform for creating and organizing notes.
- The project is based on the [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin) template.

---

If you have any questions, suggestions, or find a bug, please [create an issue](https://github.com/groldsf/obsidian_check_plugin/issues) in the repository.

## Русский

### Описание

**Checkbox Sync** — это плагин для [Obsidian](https://obsidian.md/), который автоматизирует управление состоянием чекбоксов в ваших заметках. Если все дочерние чекбоксы выполнены, плагин автоматически отмечает родительский чекбокс, а если хотя бы один из них не отмечен — снимает отметку с родительского.
### Использование

После активации плагина, он автоматически отслеживает чекбоксы в ваших заметках. Пример использования:

![](https://raw.githubusercontent.com/groldsf/obsidian_check_plugin/refs/heads/master/img/showcase.gif)

В данном примере, как только оба дочерних чекбокса будут отмечены, плагин автоматически отметит родительский чекбокс. Если хотя бы один дочерний чекбокс не отмечен, родительский сбросится.
### Установка

#### Ручная установка

1. Перейдите на [страницу релизов](https://github.com/groldsf/obsidian_check_plugin/releases) и скачайте последний архив плагина.
2. Распакуйте архив в директорию:  
   `<ваше-хранилище>/.obsidian/plugins/checkbox-sync`
3. Перезапустите Obsidian.
4. Откройте **Настройки → Плагины сообщества** и активируйте **Checkbox Sync**.

#### Установка через менеджер плагинов (если поддерживается)

1. Откройте Obsidian и перейдите в **Настройки → Плагины сообщества**.
2. Нажмите кнопку **Обзор**, найдите "Checkbox Sync" и установите его.
3. Активируйте плагин после установки.

### Разработка и вклад

Если вы хотите внести изменения или улучшения в плагин:

1. **Форкните** репозиторий.
2. Создайте новую ветку:  
   `git checkout -b feature/имя-функционала`
3. Внесите изменения и сделайте коммит:  
   `git commit -m "Описание изменений"`
4. Отправьте изменения в свой форк:  
   `git push origin feature/имя-функционала`
5. Откройте Pull Request в оригинальном репозитории.

### Лицензия

Этот проект лицензирован под лицензией 0BSD.

### Благодарности

- [Obsidian](https://obsidian.md/) — платформа для создания и организации заметок.
- Проект создан на основе шаблона [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin).

---

Если у вас есть вопросы, предложения или вы обнаружили баг, пожалуйста, [создайте issue](https://github.com/groldsf/obsidian_check_plugin/issues) в репозитории.