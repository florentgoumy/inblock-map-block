# Inblock Map Block

Lightweight Gutenberg map block for dynamic WordPress content.

Inblock Map Block lets you display WordPress content on OpenStreetMap/CARTO maps directly from the block editor. It is designed for directories, locations, events, real estate, stores, projects, and other content-driven WordPress sites.

## Free

The Free edition includes:

- Native Gutenberg block.
- OpenStreetMap, CARTO Positron, and CARTO Dark basemaps.
- Custom tile provider support.
- Dynamic markers from a selected post type.
- ACF Location fields.
- ACF text latitude/longitude fields.
- Post meta latitude/longitude fields.
- Marker clustering.
- Auto-fit to markers.
- Default, circle, dot, and custom image markers.
- Basic title + link popups.
- Gutenberg border and shadow controls.

## Pro

Inblock Map Block Pro builds on the Free edition with content-oriented mapping features:

- Advanced content filtering by taxonomy.
- Advanced filtering by custom fields/post meta.
- Result ordering.
- Rich popups with featured images.
- Rich popups with excerpts.
- Selected custom fields in popups.
- Conditional marker colors based on taxonomy terms.

Future Pro releases are planned around search, front-end filters, synchronized results lists, and richer content-driven map interfaces.

## Development

Install dependencies:

```bash
npm ci
composer install
```

Build assets:

```bash
npm run build
```

Lint JavaScript:

```bash
npm run lint:js
```

## Freemius development mode

The plugin uses the Freemius WordPress SDK through Composer. Never commit the product secret key.

For local integration testing, define the Freemius development constants only in the local WordPress site's `wp-config.php`.

## Release model

This repository is the single source for both editions.

Freemius generates:

- the WordPress.org-compatible Free package;
- the licensed Pro package.

Premium code uses Freemius `__premium_only` conventions and is removed from the generated Free package.

## License

GPL-2.0-or-later.
