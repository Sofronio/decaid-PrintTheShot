#!/usr/bin/env bash
set -euo pipefail

# Builds the release archive Decaid installs from a GitHub release.
#
# The installer enforces three things this script keeps in sync:
#   - the release tag is X.Y.Z or vX.Y.Z and equals manifest.version exactly
#   - the release carries exactly one .zip asset
#   - the archive holds a single top-level <plugin-id>/ directory with
#     manifest.json and plugin.js inside it
#
# plugin.js is a build product here (vite, from src/), so this script refuses to
# package a missing or stale one: run `npm run build` first, or use
# `npm run package`, which does both.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
plugin_id="print-the-shot.reaplugin"
plugin_dir="$repo_root/$plugin_id"
manifest="$plugin_dir/manifest.json"
dist="$repo_root/dist"

if ! command -v jq >/dev/null 2>&1; then
  echo "package: jq is required" >&2
  exit 1
fi
if ! command -v zip >/dev/null 2>&1; then
  echo "package: zip is required" >&2
  exit 1
fi

for f in "$manifest" "$plugin_dir/plugin.js"; do
  if [ ! -s "$f" ]; then
    echo "package: missing or empty ${f#"$repo_root"/} (run npm run build)" >&2
    exit 1
  fi
done

id="$(jq -r '.id' "$manifest")"
if [ "$id" != "$plugin_id" ]; then
  echo "package: manifest id is '$id', expected '$plugin_id'" >&2
  exit 1
fi

version="$(jq -r '.version' "$manifest")"
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "package: manifest version '$version' is not X.Y.Z" >&2
  exit 1
fi

api_version="$(jq -r '.apiVersion' "$manifest")"
if [ "$api_version" != "1" ]; then
  echo "package: manifest apiVersion is '$api_version', expected 1" >&2
  exit 1
fi

if ! grep -q 'createPlugin' "$plugin_dir/plugin.js"; then
  echo "package: plugin.js has no 'createPlugin' entry point" >&2
  exit 1
fi

# A stale build is worse than no build: it installs with the new version number
# and the old behaviour. The bundle is newer than the source that produces it,
# or something is out of order.
if [ "$plugin_dir/plugin.js" -ot "$repo_root/src/plugin.ts" ]; then
  echo "package: plugin.js is older than src/plugin.ts (run npm run build)" >&2
  exit 1
fi

mkdir -p "$dist"
# 文件名不带版本号:GitHub 的 releases/latest/download/<name> 直链要求名字固定,
# 带版本号的话每发一版链接就失效一次。版本号在 tag 和 manifest 里,安装器校验
# 的也是那两处。
#
# No version in the file name: GitHub's releases/latest/download/<name> link needs a
# fixed name — a versioned one breaks the link on every release. The version lives in
# the tag and the manifest, which is what the installer validates.
archive="$dist/$plugin_id.zip"
rm -f "$archive"

# -X strips extra file attributes so repeated runs produce identical bytes.
(cd "$repo_root" && zip -q -X -r "$archive" "$plugin_id")

entries="$(unzip -Z1 "$archive")"
for required in "$plugin_id/manifest.json" "$plugin_id/plugin.js"; do
  case "$entries" in
    *"$required"*) ;;
    *)
      echo "package: $archive does not contain $required" >&2
      exit 1
      ;;
  esac
done

echo "package: $archive"
echo "package: tag the release v$version (the tag must equal manifest.version)"
