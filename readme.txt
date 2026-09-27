=== Inblock Map Block ===
Contributors: inblock
Tags: block, gutenberg, map, openstreetmap, leaflet
Requires at least: 6.0
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.2.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A lightweight Gutenberg map block for displaying dynamic WordPress content with OpenStreetMap and Leaflet.

== Description ==

Inblock Map Block adds a native Gutenberg map block built for content-driven WordPress sites.

Display posts, custom post types, locations, events, stores, properties, projects, or other content as markers without relying on Google Maps.

= Free features =

* Native Gutenberg editing experience.
* OpenStreetMap, CARTO Positron, and CARTO Dark maps.
* Custom tile providers.
* Markers from any public post type.
* ACF Location support.
* ACF text latitude/longitude support.
* Post meta latitude/longitude support.
* Marker clustering.
* Auto-fit to markers.
* Default, circle, dot, and custom image markers.
* Basic title and link popups.
* Adjustable map height.
* Gutenberg border and shadow controls.

= Inblock Map Block Pro =

A commercial Pro edition is available for sites that need richer content-driven maps.

Pro adds:

* Taxonomy-based content filtering.
* Custom-field/post-meta filtering.
* Content ordering.
* Rich popups with featured images and excerpts.
* Selected custom fields in popups.
* Conditional marker colors based on taxonomy terms.

The Free plugin remains fully functional without purchasing Pro.

== Installation ==

1. Install and activate Inblock Map Block.
2. Open the block editor.
3. Insert the Inblock Map Block.
4. Choose the content source and configure the map.

== Frequently Asked Questions ==

= Does this plugin require a Google Maps API key? =

No. The default OpenStreetMap configuration does not require a Google Maps API key.

= Can I display custom post types? =

Yes. Choose any supported public post type and configure where its latitude and longitude are stored.

= Does it support ACF? =

Yes. The Free edition supports ACF Location fields and text fields containing latitude/longitude coordinates.

= What happens if I do not buy Pro? =

Nothing is disabled in the Free edition. Pro only adds additional content filtering, popup, and marker capabilities.

== Changelog ==

= 0.2.0 =
* Prepared Free and Pro editions from a single codebase.
* Added Freemius licensing and update infrastructure.
* Added premium content filtering, rich popups, and conditional marker styling.
* Exposed existing custom tile, clustering, and custom marker controls in the Free editor.
* Reworked the release pipeline to build Gutenberg assets before packaging.

= 0.1.13 =
* Compatibility update for modern block API usage.
* WordPress.org readme normalization and metadata cleanup.

== Upgrade Notice ==

= 0.2.0 =
Adds the new Free/Pro architecture and improves the Free editing experience.
