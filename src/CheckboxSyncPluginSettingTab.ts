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
            await this.plugin.updateSettings(settings => {
              settings.xOnlyMode = value;
            });
          })
      );

    new Setting(containerEl)
      .setName('Update parent checkbox state automatically')
      .setDesc('If enabled, the state of a parent checkbox will be automatically updated based on the state of its children (all children checked = parent checked). If disabled, only manually changing a parent will affect its children.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableAutomaticParentState)
        .onChange(async (value) => {
          await this.plugin.updateSettings(settings => {
            settings.enableAutomaticParentState = value;
          });
        }));
        
    new Setting(containerEl)
      .setName('Update child checkbox state automatically')
      .setDesc('If enabled, changing the state of a parent checkbox will automatically update the state of all its direct and nested children. If disabled, changing a parent checkbox will not affect its children.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableAutomaticChildState)
        .onChange(async (value) => {
          await this.plugin.updateSettings(settings => {
            settings.enableAutomaticChildState = value;
          });
        }));
  }
}