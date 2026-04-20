# Inblock Map Block

Contributors: inblock  
Tags: block, gutenberg, map, openstreetmap, leaflet  
Requires at least: 6.0  
Tested up to: 7.0  
Requires PHP: 7.4  
Stable tag: 0.1.13  
License: GPLv2 or later  
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Gutenberg block that renders an OpenStreetMap map (Leaflet) on the front-end, with optional marker settings.

## Description

- Adds a Gutenberg block **Inblock Map Block**.
- Provides map controls for center, zoom, and height.
- Supports optional marker display from configured content sources.
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
npm run lint:js
npm run build
```
