# Inblock Map Block

Lightweight Gutenberg map block for dynamic WordPress content.

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

For local WordPress Playground development:

```bash
npm run dev
```

## Freemius release model

This repository is the single source for both editions. Freemius product `40192`
generates the WordPress.org-compatible Free package and the licensed Pro package.
Premium PHP and JavaScript files use Freemius `__premium_only` naming conventions
and are removed from the generated Free archive.

Never commit the Freemius product secret key. Development-only constants belong
in the local WordPress `wp-config.php`.

## License

GPL-2.0-or-later.
