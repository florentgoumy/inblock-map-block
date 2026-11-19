# Inblock Map Block

Contributors: inblock  
Tags: block, gutenberg, map, openstreetmap, leaflet  
Requires at least: 6.0  
Tested up to: 7.0  
Requires PHP: 7.4  
Stable tag: 0.1.34
License: GPLv2 or later  
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Gutenberg block that renders an OpenStreetMap map (Leaflet) on the front-end, with optional marker settings.

## Description

- Adds a Gutenberg block **Inblock Map Block**.
- Provides map controls for center, zoom, and height.
- Supports optional marker display from configured content sources.
- Includes OpenFreeMap styles, the experimental 3D style, reusable color presets,
  theme colors, and custom MapLibre JSON or XYZ sources.
- Front-end rendering is handled via Leaflet.

## Usage

1. Build assets:

```bash
npm install
npm run build
```

2. Install in WordPress:

- Copy the plugin folder to `wp-content/plugins/inblock-map-block/`
- Activate **Inblock Map Block** in WP admin.

3. Add the block in a post/page and configure map settings.

## Development

```bash
npm install
npm run dev
```

`npm run dev` launches a local WordPress Playground with this plugin mounted and
activated directly from the current folder. It also watches the JavaScript and
CSS sources and rebuilds the assets when they change. No plugin copy is needed.

The first launch downloads WordPress and the PHP runtime. Playground stores the
local site data outside the repository and reuses it on subsequent launches.

To run the checks separately:

```bash
npm run lint:js
npm run build
```
