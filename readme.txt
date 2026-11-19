=== Inblock Map Block ===
Contributors: inblock
Tags: block, gutenberg, map, openstreetmap, leaflet, acf
Requires at least: 6.0
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.2.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A flexible Gutenberg map block for WordPress content, ACF fields and multiple locations.

== Description ==

Inblock Map Block displays WordPress content on OpenStreetMap and OpenFreeMap maps directly from the block editor.

Free features include:

* OpenStreetMap and OpenFreeMap vector styles.
* Single-content and collection marker modes.
* ACF Location, coordinate text, ACF Repeater and post-meta sources.
* Multiple locations per post and marker clustering.
* Live marker and popup previews in Gutenberg.
* Configurable popup fields from WordPress and ACF.
* Theme colors, reusable color presets and custom map colors.
* Custom XYZ and MapLibre JSON map sources.

The optional Pro edition adds advanced filtering, ordering, conditional marker colors and future content-driven map interfaces.

== Installation ==

1. Upload the plugin ZIP through the WordPress Plugins screen.
2. Activate Inblock Map Block.
3. Add the block to a post or page and configure the map.

== Frequently Asked Questions ==

= Does the default setup require an API key? =

No. OpenStreetMap and the included OpenFreeMap styles do not require an API key.

= Can one publication create several markers? =

Yes. ACF Pro Repeater rows can each provide a coordinate and optional location label.

= What does Pro add? =

Pro adds taxonomy/meta filtering, result ordering and conditional marker colors. The Free edition remains fully usable without a licence.

== Changelog ==

= 0.2.1 =
* Update the Freemius WordPress SDK to 2.13.5.
* Finalize paid-build takeover and public asset dependency loading.

= 0.2.0 =
* Integrate the Freemius Free/Pro release architecture.
* Consolidate ACF Repeater multi-location markers and the popup builder.
* Add OpenFreeMap vector styles, theme colors, presets and custom MapLibre styles.
* Add premium filtering, ordering and conditional marker extensions.

== Upgrade Notice ==

= 0.2.1 =
This maintenance release updates the Freemius SDK before the first public Free/Pro deployment.

= 0.2.0 =
This release consolidates the current MapBlock features and prepares separate Free and Pro packages through Freemius.
