export enum UnknownSymbolPolicyEnum {
  Checked = 'checked',
  Unchecked = 'unchecked',
  Ignore = 'ignore'
}

export interface CheckboxSyncPluginSettings {
  xOnlyMode: boolean;
  enableAutomaticParentState: boolean;
  enableAutomaticChildState: boolean;
  checkedSymbols: string[];
  uncheckedSymbols: string[];
  unknownSymbolPolicy: UnknownSymbolPolicyEnum;
}