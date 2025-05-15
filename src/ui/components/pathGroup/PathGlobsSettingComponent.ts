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

		const descHtml =
			`<p>List files or folders that the plugin should IGNORE. 
      This uses "glob patterns" (similar to <code>.gitignore</code> syntax) to match paths.</p>
      <ul>
        <li>Each pattern on a new line. If this list is empty, no files are ignored (plugin processes all).</li>
        <li>Example to IGNORE: <code>My Folder/</code> or <code>*.log</code></li>
        <li>Example to PROCESS an item within an IGNORED path: <code>!My Folder/My Important File.md</code></li>
        <li>The last rule that matches a file determines its fate.</li>
        <li>For more on glob syntax, search "glob patterns online" or see 
            <a href="https://en.wikipedia.org/wiki/Glob_(programming)" target="_blank" rel="noopener noreferrer">Glob (programming) on Wikipedia</a>.
        </li>
      </ul>`;

		this.setting = new Setting(container)
			.setName('Ignored Files & Folders')
			// Используем createFragmentWithHTML для описания
			.setDesc(this.createFragmentWithHTML(descHtml))
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

				text.setValue(multilineStringValue);

				text.onChange(() => {
					this.onChangeCallback();
				});
			});

		// Применяем стиль "многострочной настройки" как в Tasks плагине
		this.makeMultilineTextSetting();
	}

	/**
	 * Изменяет стиль Setting, чтобы описание было над TextArea, а TextArea занимала всю ширину.
	 */
	private makeMultilineTextSetting(): void {
		if (!this.setting) return;

		const { settingEl, infoEl, controlEl } = this.setting;
		const textAreaEl: HTMLTextAreaElement | null = controlEl.querySelector('textarea');

		if (textAreaEl === null) {
			// Это не настройка с TextArea, ничего не делаем
			return;
		}

		settingEl.style.display = 'block';
		// infoEl может не существовать, если .setName() и .setDesc() не вызывались или были очищены.
		// В нашем случае они вызываются, так что infoEl должен быть.
		if (infoEl) {
			infoEl.style.marginBottom = 'var(--size-4-2)'; // Небольшой отступ под описанием
			infoEl.style.marginRight = '0px'; // Убираем отступ справа, если он был
		}

		// Для controlEl (контейнер для textarea)
		controlEl.style.width = '100%'; // Заставляем контейнер контрола быть на всю ширину

		// Для самой textarea
		textAreaEl.style.width = '100%'; // Занимает всю ширину controlEl
		textAreaEl.style.minHeight = '120px'; // Минимальная высота для нескольких строк
		textAreaEl.rows = 8;
	}


	getValueFromUi(): string[] {
		if (this.textInput) {
			const rawValue = this.textInput.getValue();
			return rawValue
				.split('\n')
				.map(s => s.trim())
				.filter(s => s.length > 0 && !s.startsWith('#'));
		}
		throw new Error(`[${this.getSettingKey()}] Cannot get value from UI: TextArea component not rendered or available.`);
	}

	setValueInUi(value: any): void {
		if (this.textInput) {
			if (value === undefined) {
				this.textInput.setValue('');
				return;
			}
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
