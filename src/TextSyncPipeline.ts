import { ICheckboxUtils } from "./core/interface/ICheckboxUtils";
import { FileFilter } from "./FileFilter";
import { IFilePathStateHolder } from "./IFilePathStateHolder";

export default class TextSyncPipeline {
	private checkboxUtils: ICheckboxUtils;
	private fileStateHolder: IFilePathStateHolder;
	private fileFilter: FileFilter;


	constructor(checkboxUtils: ICheckboxUtils, fileStateHolder: IFilePathStateHolder, fileFilter: FileFilter) {
		this.checkboxUtils = checkboxUtils;
		this.fileStateHolder = fileStateHolder;
		this.fileFilter = fileFilter;
	}

	public applySyncLogic(currentText: string, filePath: string): string {
		return this.fileStateHolderDecorator(currentText, filePath);
	}

	private coreDecorator(currentText: string, textBefore: string | undefined): string {
		const resultingText = this.checkboxUtils.syncText(currentText, textBefore);
		return resultingText;
	}

	private pathAllowedDecorator(currentText: string, textBefore: string | undefined, filePath: string): string {
		if (!this.fileFilter.isPathAllowed(filePath)) {
			console.log(`pathAllowedDecorator "${filePath}" skip, path is not allowed.`);
			return currentText;
		}
		return this.coreDecorator(currentText, textBefore);
	}

	private fileStateHolderDecorator(currentText: string, filePath: string): string {
		const textBefore = this.fileStateHolder.getByPath(filePath);
		const resultingText = this.pathAllowedDecorator(currentText, textBefore, filePath);
		this.fileStateHolder.setByPath(filePath, resultingText);
		return resultingText;
	}
}
