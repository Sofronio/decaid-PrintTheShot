# Print The Shot for Decaid

A [Decaid](https://github.com/decentespresso/decaid) plugin that uploads finished
shots to a local print server in the DE1's TCL print format — the shape
[PrintTheShot](https://github.com/Sofronio/DecentEspressoPrintTheShot-next)
renders into a chart and sends to a thermal printer.

No Decaid release is needed to use this: it installs from this repository's
releases.

## Install

From the Decaid REST API, which installs this repository's latest release:

```bash
curl -X POST http://localhost:8080/api/v1/plugins/install/github-release \
  -H 'content-type: application/json' \
  -d '{"repo": "Sofronio/decaid-PrintTheShot"}'
```

Or open the Plugins settings screen in Decaid and install from the repository.

Settings: server address (`host:port`), upload path (default `upload`), web UI
address, HTTP or HTTPS, the machine name sent as `machine_id`, whether to upload
automatically as shots finish, and a minimum shot length so flushes are skipped.

## Where things are

Three addresses across **two servers**. Decaid serves its own API and the plugin
pages on port `8080`; the print server is a separate program, on the address in
the Server address setting, with its web UI on `8000`.

**The plugin's settings**, in Decaid:

1. back out of the skin to Decaid's own screens;
2. **Plugins** — the plugin list;
3. find **Print The Shot**, then press **Settings** on its row (or the ⋮ menu →
   Settings).

That dialog *is* the settings: server address, upload path, web UI address, HTTP
or HTTPS, auto upload, machine name, minimum shot length.

**The plugin's page** — the shot browser, with paging through shots, the log and
the manual print buttons — is served by Decaid itself:

```
http://<decaid-host>:8080/api/v1/plugins/print-the-shot.reaplugin/ui
```

`<decaid-host>` is `localhost` on the machine running Decaid, and that machine's
LAN address from a phone or desktop. It is the same string the **Web UI address**
setting holds, which is why that field is prefilled with it.

**The print server's page** — every shot received, charts, date filters — is
served by the print server, at the address shots are uploaded to:

```
http://<server-address>:8000/
```

A different program from Decaid, hence the different port: Decaid decides what
gets sent, the print server decides what comes out of the printer.

## What it does

- `shotStored` events (once the `AutoUpload` setting is on) are converted to the
  TCL print format and POSTed to the configured server. The shot's tasting note
  travels as the bean notes; the profile description stays in `profile.notes`
  where it belongs.
- The uploaded body carries an explicit `Content-Length`. The host's Dart
  `HttpClient` would otherwise send it chunked, and simple print servers (Python
  `http.server`, ESP32 sketches) read bodies by `Content-Length` and would save
  an empty file — silently, with no error on either side.
- The page (`ui` endpoint) browses stored shots, prints one on demand, and shows
  upload results. It is optional: a skin can drive the same endpoints directly.

## Endpoints

| id | type | what it does |
| --- | --- | --- |
| `ui` | http | serves the plugin's page |
| `upload` | http | `POST {url, shot}` — proxies one upload so the browser never has to make a cross-origin request to the LAN |
| `debug` | http | `GET` plugin version and load status |
| `events` | websocket | pushes the id of each newly stored shot |

## Development

```bash
npm ci
npm test          # transform tests (vitest)
npm run build     # src/plugin.ts -> print-the-shot.reaplugin/plugin.js
npm run package   # build + scripts/package.sh -> dist/<id>-<version>.zip
npm run serve     # dev server for the page
```

`plugin.js` is a build product. Run `npm run build` before `package.sh`; the
package script refuses a bundle older than its source, because a stale bundle
installs with the new version number and the old behaviour.

The version is written in one place — `print-the-shot.reaplugin/manifest.json` —
and injected into the bundle at build time. The release tag has to equal it, so
`v1.4.0` and `"version": "1.4.0"` go together:

```bash
git tag v1.4.0 && git push origin v1.4.0   # CI builds, tests, packages, releases
```

## Tests in Decaid

`test/plugins/` holds the manifest/contract test. It imports Decaid's own plugin
harness, so it runs from a Decaid checkout — see `test/README.md`.
