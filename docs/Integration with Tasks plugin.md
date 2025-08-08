There is partial integration with the Tasks plugin.
The goal is to add or remove a timestamp on checkboxes modified by the current plugin. In theory, if other tags appear, it should work as well.

Unfortunately, their current Tasks API does not provide a method to set a specific symbol or checkbox state, but it does offer a method to emulate a “click” on the checkbox.
Therefore, under certain specific transition settings in the Tasks plugin, this will not work — for example, when it is impossible to transition from the current state to the completed state.