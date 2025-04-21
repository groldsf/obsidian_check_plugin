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