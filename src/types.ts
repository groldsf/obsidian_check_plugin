export interface CheckboxSyncPluginSettings {
  xOnlyMode: boolean;
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
  xOnlyMode: true,
  enableAutomaticParentState: true,
  enableAutomaticChildState: true,
  checkedSymbols: ['x'],
  uncheckedSymbols: [' '],
  unknownSymbolPolicy: CheckboxState.Checked, 
};