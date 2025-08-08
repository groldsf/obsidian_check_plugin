import { Context } from "../model/Context";

export interface CheckboxProcess {
	process(context: Context): void;
}
