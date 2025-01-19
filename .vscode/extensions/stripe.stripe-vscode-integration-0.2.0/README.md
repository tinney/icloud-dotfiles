# Sorbet Extension for VS Code (Beta)

This extension integrates Sorbet into VS Code. It also bundles `rubyLocate` from [vscode-ruby](https://github.com/rubyide/vscode-ruby) to provide features that are not yet stable in Sorbet. Features provided by `rubyLocate` do not use any Sorbet type information, and may not be that precise.

This extension supports the following features:

* Error squiggles for Sorbet typechecking errors that update as-you-type.
* Go-to-definition (imprecise; using Ruby Locate)
* Workspace symbol search (imprecise; using Ruby Locate)
* Document outline (imprecise; using Ruby Locate)

Additional features will be made available as we stabilize them in Sorbet.

## Configuring the Extension

To configure the extension for a new repository, add the following settings:

```json
{
  // Can be 'rubyLocate' to disable Sorbet integration entirely, or 'none' to disable the extension.
  // Defaults to 'none'.
  "sorbet.intellisenseProvider": "sorbet",
  // (Optional) Path to Sorbet. Defaults to `sorbet` on PATH.
  "sorbet.sorbetPath": "sorbet",
  // Extra arguments to pass to Sorbet. Currently requires passing "." (the current directory)
  // TODO: Fix this bug by making scripts/bin/typecheck not pass directory when LSP is enabled.
  "sorbet.extraArgs": ["."]
}
```

