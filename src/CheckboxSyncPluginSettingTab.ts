import { App, PluginSettingTab, Setting } from "obsidian";
import CheckboxSyncPlugin from "./main";

export class CheckboxSyncPluginSettingTab extends PluginSettingTab {
  plugin: CheckboxSyncPlugin;

  constructor(app: App, plugin: CheckboxSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("X-Only Mode")
      .setDesc("When enabled, only 'x' marks a task as complete. When disabled, any character except space marks a task as complete")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.xOnlyMode)
          .onChange(async (value) => {
            await this.plugin.updateSettings((settings) => {
              settings.xOnlyMode = value;
            });
          })
      );
  }
}