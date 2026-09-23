import { defineConfig } from "vite";
import { resolve } from "path";
import { readFileSync } from "fs";

// The version the plugin reports is read from the manifest at build time, so
// the manifest stays the single place it is written: the release tag has to
// equal it, and a second hardcoded copy in the source is one that can drift.
const manifest = JSON.parse(
  readFileSync(resolve(__dirname, "print-the-shot.reaplugin/manifest.json"), "utf-8")
) as { version: string };

// Builds src/plugin.ts into print-the-shot.reaplugin/plugin.js.
//
// The output path is the directory scripts/package.sh zips, so a build followed
// by a package run is all a release needs. The manifest is not generated: it
// lives in that same directory and is edited there, one copy only.
//
// (Inside the Decaid tree this package used to emit into the app's
// assets/plugins/, which is why the path here is relative to this repository
// instead.)
export default defineConfig({
  define: {
    __PLUGIN_VERSION__: JSON.stringify(manifest.version),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/plugin.ts"),
      name: "createPlugin",
      formats: ["iife"],
      fileName: () => "plugin.js",
    },
    outDir: resolve(__dirname, "print-the-shot.reaplugin"),
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      output: {
        footer: "",
      },
    },
  },
});
