export type UnknownSymbolPolicy = 'checked' | 'unchecked' | 'ignore';

export interface CheckboxSyncPluginSettings {
  xOnlyMode: boolean;
  enableAutomaticParentState: boolean;
  enableAutomaticChildState: boolean;
  checkedSymbols: string[];
  uncheckedSymbols: string[];
  unknownSymbolPolicy: UnknownSymbolPolicy;
}