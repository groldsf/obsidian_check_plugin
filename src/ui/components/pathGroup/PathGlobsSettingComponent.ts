import { Setting, TextAreaComponent } from 'obsidian';
import { CheckboxSyncPluginSettings } from 'src/types';
import { BaseSettingComponent } from 'src/ui/basedClasses/BaseSettingComponent';
import { ValidationError } from 'src/ui/validation/types';

export class PathGlobsSettingComponent extends BaseSettingComponent {
  private textInput: TextAreaComponent;

  getSettingKey(): keyof CheckboxSyncPluginSettings {
    return 'pathGlobs';
  }

  private arrayToMultilineString(value: string[] | undefined | null): string {
    if (Array.isArray(value)) {
      try {
        return value.join('\n');
      } catch (e) {
        console.error(`[${this.getSettingKey()}] Error joining array to multiline string: `, e);
        return '';
      }
    }
    return '';
  }

  render(container: HTMLElement, currentValue: any): void {
    const multilineStringValue = this.arrayToMultilineString(currentValue as string[] | undefined);

    this.setting = new Setting(container)
      .setName('Ignored Files & Folders')
      .setDesc('List files or folders that the plugin should IGNORE. ' +
               'This uses "glob patterns" (similar to .gitignore syntax) to match paths.\n' + 
               '- Each pattern on a new line. If this list is empty, no files are ignored (plugin processes all).\n' +
               '- Example to IGNORE: `My Folder/` or `*.log`\n' +
               '- Example to PROCESS an item within an IGNORED path: `!My Folder/My Important File.md`\n' +
               '- The last rule that matches a file determines its fate.'
      )
      .addTextArea(text => {
        this.textInput = text;
        text.setPlaceholder(
            '# Lines starting with # are comments and will be ignored\n' +
            'Drafts/\n' +
            '*.tmp\n' +
            '!Drafts/ReadyToPublish.md\n\n' +
            '# To process ONLY files in "Projects" folder:\n' +
            '*\n' +
            '!Projects/**'
        );
        text.inputEl.setAttr('rows', 10); // Увеличил немного для плейсхолдера
        text.inputEl.style.width = '100%';
        
        text.setValue(multilineStringValue);
        
        text.onChange(() => {
          this.onChangeCallback(); 
        });
      });
  }

  getValueFromUi(): string[] {
    if (this.textInput) {
      const rawValue = this.textInput.getValue();
      return rawValue
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('#')); // Игнорируем пустые строки и комментарии
    }
    throw new Error(`[${this.getSettingKey()}] Cannot get value from UI: TextArea component not rendered or available.`);
  }

  setValueInUi(value: any): void {
    if (this.textInput) {
      if (value === undefined) {
          this.textInput.setValue('');
          return;
      }
      // Ожидаем, что value это string[]. Если нет, будет ошибка времени выполнения при .join()
      this.textInput.setValue((value as string[]).join('\n'));
    } else {
      throw new Error(`[${this.getSettingKey()}] Cannot set value in UI: TextArea component not rendered or available.`);
    }
  }

  validate(): ValidationError | null {
    try {
      this.getValueFromUi();
    } catch (e: any) {
      return { field: this.getSettingKey(), message: e.message };
    }
    return null;
  }
}
