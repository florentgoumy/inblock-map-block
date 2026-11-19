=== Inblock Map Block ===
Contributors: inblock
Tags: block, gutenberg, map, openstreetmap, leaflet
Requires at least: 6.0
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1.34
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A Gutenberg block to display an OpenStreetMap map and optional markers from selected content.

== Description ==

Inblock Map Block adds a configurable OpenStreetMap block for the WordPress block editor.

Features include:

* Center and zoom controls.
* Adjustable map height.
* Optional markers loaded from a post type.
* Leaflet-based front-end rendering.
* OpenFreeMap vector styles, including 3D, with theme and MapBlock color presets.
* Advanced custom map sources using XYZ tiles or a hosted MapLibre style JSON.

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/inblock-map-block/`.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Open the block editor and insert **Inblock Map Block**.
4. Configure map center, zoom, and marker options.

== Frequently Asked Questions ==

= Does this plugin require OpenStreetMap API keys? =

No. The default OpenStreetMap tile layer works without API keys.

= Can I display markers from my content? =

Yes. Enable markers in block settings and choose a source supported by your site configuration.

== Changelog ==

= 0.1.34 =
* Add the official OpenFreeMap 3D style as an experimental base map.
* Add Pastel, Monochrome, Nature and High contrast MapBlock color presets.
* Add custom MapLibre style JSON URLs while preserving custom XYZ sources.

= 0.1.30 =
* Expose marker clustering controls in the Markers panel.
* Consolidate editor viewport updates and narrow the cross-document drag release fallback.

= 0.1.29 =
* Restore the visual styles for marker clusters in the editor and front end.

= 0.1.28 =
* Read Repeater coordinates and optional labels independently from their row meta.

= 0.1.27 =
* Refit the editor map when Repeater location labels rebuild the marker layer.

= 0.1.26 =
* Stop identical Leaflet viewport events from causing Gutenberg render loops.
* Safely normalize optional ACF Repeater location labels.

= 0.1.25 =
* Prevent an editor auto-fit feedback loop when multiple markers are previewed.

= 0.1.24 =
* Keep the editor usable when a Repeater row contains invalid preview data.

= 0.1.23 =
* Restore marker pointer events in Gutenberg and improve popup field controls.

= 0.1.22 =
* Add multiple markers per post from an ACF Pro Repeater with configurable coordinates and label sub-fields.

= 0.1.21 =
* Prevent Gutenberg from intercepting marker clicks in the block editor.

= 0.1.20 =
* Preview configured marker popups directly in the block editor.

= 0.1.19 =
* Add native WordPress fields and configurable title/link presentation to the popup builder.

= 0.1.18 =
* Add a popup builder with up to five safe ACF fields, custom labels and ordering.

= 0.1.17 =
* Preview Single and Collection markers directly in the block editor.
* Apply auto-fit to the marker preview in the block editor.

= 0.1.16 =
* Add Single and Collection marker modes in the block editor.
* Move the post type selector into the Markers panel and show the limit only for collections.
* Filter the post type selector to relevant public, queryable content types.

= 0.1.15 =
* Fix map dragging getting stuck after releasing the pointer in the block editor.

= 0.1.14 =
* Add a customizable details link label for marker popups, defaulting to "Plus d’infos".

= 0.1.13 =
* Compatibility update for modern block API usage.
* WordPress.org readme normalization and metadata cleanup.

== Upgrade Notice ==

= 0.1.17 =
Markers and automatic fitting are now visible while editing the block.

= 0.1.16 =
Marker settings now distinguish the current content from content collections while preserving existing collection blocks.

= 0.1.15 =
Fixes pointer release handling when dragging the map in the block editor.

= 0.1.14 =
Marker popup links now use a customizable, readable label instead of displaying the raw URL.

= 0.1.13 =
Recommended update for WordPress.org compliance and block editor compatibility.
