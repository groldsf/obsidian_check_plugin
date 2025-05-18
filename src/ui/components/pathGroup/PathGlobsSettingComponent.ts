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
			`<p>Define rules to specify which files and folders the plugin should IGNORE. 
      Uses the same pattern syntax as <code>.gitignore</code> files (powered by the 'ignore' library).</p>
      <p>For detailed syntax, refer to the 
          <a href="https://git-scm.com/docs/gitignore" target="_blank" rel="noopener noreferrer">official .gitignore documentation</a>.
      </p>`;

		this.setting = new Setting(container)
			.setName('File Ignore Rules (.gitignore style)')
			// Используем createFragmentWithHTML для описания
			.setDesc(this.createFragmentWithHTML(descHtml))
			.addTextArea(text => {
				this.textInput = text;
				text.setPlaceholder(
					'# Examples:\n' +
            '# Ignore all files in the "Drafts" folder\n' +
            'Drafts/\n\n'
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
