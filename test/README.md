# Tests

These tests live here because the plugin owns its own contract, but they
**cannot run standalone**: they exercise the plugin through Decaid's plugin
harness, not a copy of it.

The imports resolve against a Decaid checkout, not this repository
(`package:reaprime/src/plugins/plugin_manifest.dart`), so run them from there:

```bash
cp test/plugins/print_the_shot_plugin_test.dart <decaid>/test/plugins/
cd <decaid> && flutter test test/plugins/print_the_shot_plugin_test.dart
```

What they check is the install contract, not the upload logic: the manifest
parses against Decaid's own `PluginManifest`, the id matches the directory, the
permissions and endpoints are the declared ones, and the built `plugin.js`
carries the same version the manifest declares (a mismatch between tag,
manifest and bundle is exactly what the installer rejects).

The upload/transform logic is covered by the TypeScript tests in `tests/`
(`npm test`), which do run standalone.
