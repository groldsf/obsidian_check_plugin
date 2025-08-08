import { ToggleComponent, Setting } from "obsidian";
import { CheckboxSyncPluginSettings } from "src/types";
import { BaseSettingComponent } from "src/ui/basedClasses/BaseSettingComponent";
import { ValidationError } from "src/ui/validation/types";
import { validateValueIsBoolean } from "src/ui/validation/validators";


export class EnableConsoleLogSettingComponent extends BaseSettingComponent {
	private toggleComponent: ToggleComponent;

	constructor() {
		super();
	}

	getSettingKey(): keyof CheckboxSyncPluginSettings {
		return 'consoleEnabled';
	}

	render(container: HTMLElement, currentValue: any): void {
		this.setting = new Setting(container)
			.setName('Enable console logs')
			.addToggle(toggle => {
				this.toggleComponent = toggle;
				toggle
					.setValue(currentValue as boolean)
					.onChange(this.onChangeCallback);
			});
	}

	getValueFromUi(): boolean {
		if (this.toggleComponent) {
			return this.toggleComponent.getValue();
		}
		throw new Error(`[${this.getSettingKey()}] Cannot get value from UI before component is rendered.`);
	}

	setValueInUi(value: any): void {
		if (this.toggleComponent) {
			this.toggleComponent.setValue(value as boolean);
		} else {
			throw new Error(`[${this.getSettingKey()}] Cannot set value before component is rendered.`);
		}
	}

	validate(): ValidationError | null {
		const valueFromUi = this.getValueFromUi();
		const validationResult = validateValueIsBoolean(valueFromUi);

		if (validationResult) {
			return {
				field: this.getSettingKey(),
				message: validationResult.message
			};
		}
		return null;
	}
}
