export interface CheckboxSyncPluginSettings {
  enableAutomaticParentState: boolean;
  enableAutomaticChildState: boolean;
  checkedSymbols: string[];
  uncheckedSymbols: string[];
  ignoreSymbols: string[];
  unknownSymbolPolicy: CheckboxState;
  enableAutomaticFileSync: boolean;
}

export enum CheckboxState {
  Checked = 'checked',
  Unchecked = 'unchecked',
  Ignore = 'ignore'
}

export const DEFAULT_SETTINGS: CheckboxSyncPluginSettings = {
  enableAutomaticParentState: true,
  enableAutomaticChildState: true,
  checkedSymbols: ['x'],
  uncheckedSymbols: [' '],
  ignoreSymbols: [],
  unknownSymbolPolicy: CheckboxState.Checked, 
  enableAutomaticFileSync: false,
};