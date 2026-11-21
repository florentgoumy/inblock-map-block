# Inblock Map Block

Lightweight Gutenberg map block for dynamic WordPress content.

[![Build and validate WordPress plugin](https://github.com/florentgoumy/inblock-map-block/actions/workflows/build-plugin.yml/badge.svg)](https://github.com/florentgoumy/inblock-map-block/actions/workflows/build-plugin.yml)

## Free edition

The Free edition is a complete mapping block for ordinary WordPress sites:

- OpenStreetMap and OpenFreeMap vector basemaps.
- Single and collection marker modes.
- ACF Location, text coordinates, ACF Repeater and post-meta sources.
- Multiple locations per post, clustering and editor previews.
- Configurable popups with WordPress and ACF fields (up to five).
- Theme-aware colors, MapBlock color presets and custom colors.
- Custom XYZ sources and hosted MapLibre style JSON URLs.
- Border, shadow and responsive block controls.

## Pro edition

The licensed Pro package adds content-oriented controls:

- Taxonomy and post-meta filtering.
- Result ordering.
- Conditional marker colors driven by taxonomy terms.
- Premium extension bundles and future search/list synchronization features.

The existing premium rich-popup attributes remain supported for compatibility,
although the Free popup builder now covers most common popup content needs.

## Development

Install dependencies and build all Free and Pro assets:

```bash
npm ci
composer install
npm run build
```

Run the quality checks used by CI:

```bash
npm run check:js
composer check
```

Generate the translation template and an installable ZIP:

```bash
npm run make-pot
npm run plugin-zip
```

For local WordPress Playground development:

```bash
npm run dev
```

## Freemius release model

This repository is the single source for both editions. Freemius product `40192`
generates the WordPress.org-compatible Free package and the licensed Pro package.
Premium PHP and JavaScript files use Freemius `__premium_only` naming conventions
and are removed from the generated Free archive.

The GitHub Actions workflow builds the production assets, installs production-only
Composer dependencies, applies `.distignore`, runs the official WordPress Plugin
Check action against the resulting directory, and uploads a ready-to-install ZIP.

## Repository layout

- `src/`: human-readable JavaScript and Sass sources.
- `build/`: compiled assets loaded by WordPress and committed for reproducible releases.
- `includes/`: PHP modules, including files removed from the Free package by Freemius.
- `languages/`: translation template and local translation files.
- `wp-org-assets/`: WordPress.org banners, icons and screenshots; excluded from plugin ZIPs.
- `dist/`: generated release artifacts; never committed.

## External services and privacy

Displayed maps request tiles or styles from OpenStreetMap, OpenFreeMap, or a custom
provider configured by the site administrator. These requests expose ordinary
network request data to that provider. The WordPress.org `readme.txt` documents
the providers, their terms, and their privacy policies. Freemius communication is
subject to an explicit administrator opt-in.

## Third-party software

Bundled JavaScript libraries and their licenses are listed in
`THIRD-PARTY-NOTICES.md`. All production assets are served locally; only map data
and styles are requested from the configured map provider.

Never commit the Freemius product secret key. Development-only constants belong
in the local WordPress `wp-config.php`.

## License

GPL-2.0-or-later.
