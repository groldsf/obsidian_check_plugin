export interface CheckboxSyncPluginSettings {
  enableAutomaticParentState: boolean;
  enableAutomaticChildState: boolean;
  checkedSymbols: string[];
  uncheckedSymbols: string[];
  unknownSymbolPolicy: CheckboxState;
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
  unknownSymbolPolicy: CheckboxState.Checked, 
};