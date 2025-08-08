export interface CheckboxSyncPluginSettings {
  tabSize: number,
  enableAutomaticParentState: boolean;
  enableAutomaticChildState: boolean;
  checkedSymbols: string[];
  uncheckedSymbols: string[];
  ignoreSymbols: string[];
  unknownSymbolPolicy: CheckboxState;
  enableAutomaticFileSync: boolean;
	consoleEnabled: boolean;
	pathGlobs: string[];
}

export enum CheckboxState {
  Checked = 'checked',
  Unchecked = 'unchecked',
  Ignore = 'ignore',
	NoCheckbox = "noCheckbox"
}

export const DEFAULT_SETTINGS: CheckboxSyncPluginSettings = {
  tabSize: 4,
  enableAutomaticParentState: true,
  enableAutomaticChildState: true,
  checkedSymbols: ['x'],
  uncheckedSymbols: [' '],
  ignoreSymbols: [],
  unknownSymbolPolicy: CheckboxState.Checked, 
  enableAutomaticFileSync: false,
	consoleEnabled: false,
	pathGlobs: [],
};
