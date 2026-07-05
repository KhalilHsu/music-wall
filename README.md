# Music Wall

Music Wall is a local-first browser display for album artwork. It renders a full-screen animated cover wall with theme controls, motion controls, density settings, fullscreen mode, and optional local Music.app artwork sync on macOS.

## Compatibility

| Mode | macOS | iPadOS / iOS | Windows / Linux | Notes |
| --- | --- | --- | --- | --- |
| Generated demo wall | Yes | Yes | Yes | Open `index.html` or run the server. No personal library access. |
| Local Music.app sync | Yes | No | No | Uses macOS `iTunesLibrary.framework` through a local Swift script. |
| Apple Music API / MusicKit cloud library | No | No | No | Not implemented. No developer token is required. |
| AirPlay / Apple TV | Limited | Limited | Limited | Browser APIs can expose media pickers, not full-page webpage casting. |

The current real library integration is **macOS Music.app local library sync**, not Apple Music API access. Apple Music subscription content may work only when Music.app exposes artwork through the local library framework. Cloud-only items or tracks without accessible artwork can be skipped.

## Requirements

For the visual wall only:

- A modern browser: Safari, Chrome, Edge, or Firefox
- No build step

For Local Music sync on macOS:

- macOS with Music.app library data
- Node.js 18 or newer
- npm
- Swift toolchain / Xcode Command Line Tools

If `swift` is missing, install Apple's command line tools:

```sh
xcode-select --install
```

## Quick Start

```sh
git clone <repo-url>
cd music-wall
npm start
```

Open:

```text
http://127.0.0.1:4173/
```

The wall will work immediately with generated artwork. On macOS, open Settings in the app and click `Sync` to load local Music.app album artwork.

## Use Without Local Music Sync

You can open `index.html` directly in a browser. This runs the generated cover wall only:

```text
index.html
```

Local Music sync requires `npm start` because a browser cannot directly read the local Music.app database.

## Local Music Sync

On macOS, the server uses:

```text
scripts/export-local-music-library.swift
```

That script uses `iTunesLibrary.framework` to read album metadata and artwork from Music.app. Synced data is written to:

```text
local-data/music/
```

That directory is intentionally ignored by Git because it can contain a user's personal album list and artwork cache.

Default sync limit:

```text
2000 albums
```

Override it:

```sh
LOCAL_MUSIC_LIMIT=5000 npm start
```

## Viewing From Another Device

By default the server binds to `127.0.0.1`, so it is only available on the same Mac.

To view the wall from an iPad or another display on the same trusted Wi-Fi:

```sh
HOST=0.0.0.0 npm start
```

Then open your Mac's local network URL from the other device, for example:

```text
http://192.168.1.10:4173/
```

Only do this on trusted networks. When `HOST=0.0.0.0`, the local artwork cache and Local Music API can be reachable by other devices on that network. This companion server is not designed to be exposed to the public internet.

## AirPlay And Casting

Browser JavaScript cannot directly cast an arbitrary webpage DOM to Apple TV. Safari/WebKit and the Remote Playback API expose media-element playback controls, not full-page screen mirroring.

The Cast button therefore only attempts the browser's available AirPlay or Remote Playback media picker. Full-page Apple TV display requires system Screen Mirroring or a future dedicated receiver/companion app.

## Privacy

This project is designed to be local-first:

- No Apple Developer token is required for the default Local Music flow.
- No Music User Token is stored in the source tree.
- Album metadata and artwork stay in `local-data/` on the user's machine.
- The companion server binds to `127.0.0.1` by default.
- Synced album artwork may be copyrighted; review screenshots or recordings before sharing them publicly.

See [PRIVACY.md](./PRIVACY.md) before publishing forks, screenshots, or synced data.

## Troubleshooting

### `swift: command not found`

Install Xcode Command Line Tools:

```sh
xcode-select --install
```

### Sync returns no albums

- Open Music.app once and confirm your library is available.
- Check that albums have artwork.
- Some cloud-only Apple Music items may not expose artwork through `iTunesLibrary.framework`.
- Try a smaller sync:

```sh
LOCAL_MUSIC_LIMIT=200 npm start
```

### iPad or another device cannot open the page

The default server is localhost-only. Restart with:

```sh
HOST=0.0.0.0 npm start
```

Then use the Mac's LAN IP address. Keep this to trusted networks.

### Need detailed sync errors

Detailed server errors are hidden from API responses by default. Check the terminal running `npm start`, or start in development mode:

```sh
NODE_ENV=development npm start
```

### Cast does not show Apple TV

That is a browser/platform limitation for full-page casting. The in-app Cast button can only try browser media picker APIs. For the full wall on Apple TV, use system Screen Mirroring or build a dedicated receiver app.

## Development

```sh
npm run check
```

## License

MIT. See [LICENSE](./LICENSE).
