# inblock-map-block

Gutenberg block that renders an OpenStreetMap map (Leaflet) on the front-end, with simple settings for latitude / longitude / zoom.

## V1 scope

### What V1 does

- Adds a Gutenberg block **Inblock Map Block**.
- Block attributes:
  - `lat` (number)
  - `lng` (number)
  - `zoom` (number)
- Editor: shows a Leaflet preview of the map.
- Front-end: renders the map via **Leaflet** (script loaded through the block `viewScript`).

### What V1 does NOT do (yet)

- **Post type markers**: plotting markers/items from a selected post type is **out of scope for V1** for now.
- Any dynamic query / marker clustering / filters.

## Usage

1. Build assets:

```bash
npm install
npm run build
```

2. Install in WordPress:

- Copy the plugin folder to `wp-content/plugins/inblock-map-block/`
- Activate **Inblock Map Block** in WP admin.

3. Add the block in a post/page, then adjust:

- Latitude
- Longitude
- Zoom

The front-end map is initialized from the rendered HTML `data-*` attributes (`data-lat`, `data-lng`, `data-zoom`).

## Development

```bash
npm run lint:js
npm run build
```

## Versioning

Current version: **0.1.0** (V1 feature scope as defined above).
