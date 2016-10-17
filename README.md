# Atom Defold IDE

This package provides hot reloading, autocompletion and in-line API docs for the [Defold](http://defold.com) game engine.

![](https://cloud.githubusercontent.com/assets/428060/19451864/20406326-94b7-11e6-90a5-6f177211a353.png)

## Hot Reload

Just like with the Defold editor, you can press `cmd-r` to [hot reload](http://www.defold.com/manuals/debugging/#anchor-hr) the current file.

In order for this feature to work, you need to download `bob.jar` from `http://d.defold.com/` and provide the path to it in the package settings. Make sure you always match the version of the Defold Editor that you use.

## Autocomplete

Autocompletion is provided through [atom-autocomplete-lua](https://atom.io/packages/autocomplete-lua).

The API references are automatically downloaded and kept up to date to the latest Defold releases.
