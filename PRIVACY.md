# Privacy

Music Wall can show generated artwork without reading any personal library data. Local Music sync is optional and local-only.

## Compatibility Boundary

The default library integration is macOS-only. It reads the local Music.app library through Apple's `iTunesLibrary.framework`.

It does not read Apple Music cloud libraries through MusicKit, does not require an Apple Developer account, and does not send library data to a hosted service.

## Local Data

When Local Music sync is used, the app creates:

```text
local-data/music/albums.json
local-data/music/artwork/
```

This data may reveal a user's album library and should not be committed, uploaded, or included in public screenshots if privacy matters.

`local-data/` is ignored by `.gitignore`.

## Artwork Copyright

Synced album artwork may be copyrighted by artists, labels, or other rights holders. Music Wall caches artwork locally for personal display. Review screenshots, recordings, demos, and social posts before sharing them publicly.

## Credentials

Do not commit:

- Apple Developer private keys
- MusicKit developer tokens
- Music User Tokens
- `.env` files
- Any exported local library cache

The default implementation does not require Apple Music API credentials.

## Local Server

The companion server binds to `127.0.0.1` by default so the Local Music API is not exposed to the local network.

If you set `HOST=0.0.0.0`, the local API and artwork cache may be reachable by other devices on the same network. Only do that on trusted networks.

This server is intended as a local companion process, not a public internet service.

## Public Repository Checklist

Before publishing:

- Confirm `local-data/` is not tracked.
- Confirm `.env`, `.p8`, token files, and generated output are not tracked.
- Review screenshots for personal album artwork or library details.
- Review screenshots or videos for copyrighted album artwork.
- Add a license if the project is intended to be open source.
