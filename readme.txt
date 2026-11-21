=== Inblock Map Block ===
Contributors: florentgoumy
Tags: block, map, openstreetmap, location, acf
Requires at least: 6.3
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.2.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A flexible map block for WordPress content, ACF fields and multiple locations.

== Description ==

Inblock Map Block displays WordPress content on interactive maps directly from the block editor. It works without ACF, while optionally supporting ACF and ACF Pro location fields.

Free features include:

* OpenStreetMap and OpenFreeMap vector styles.
* Single-content and collection marker modes.
* ACF Location, coordinate text, ACF Repeater and post-meta sources.
* Multiple locations per post and marker clustering.
* Live marker and popup previews in Gutenberg.
* Configurable popup fields from WordPress and ACF.
* Theme colors, reusable color presets and custom map colors.
* Custom XYZ and MapLibre JSON map sources.

The optional Pro edition is distributed separately and adds advanced filtering, ordering and conditional marker colors. The WordPress.org package contains a complete, unrestricted Free edition.

Source code and build instructions are available on GitHub:
https://github.com/florentgoumy/inblock-map-block

== Installation ==

1. Upload the plugin ZIP through the WordPress Plugins screen.
2. Activate Inblock Map Block.
3. Add the block to a post or page and configure the map.

== External services ==

The block loads map tiles only when a page containing a map is displayed. The selected provider receives normal web-request information such as the visitor's IP address, browser user agent and referring page.

* OpenStreetMap is the default raster tile provider. Its tiles are subject to the OpenStreetMap Foundation tile usage policy and privacy policy: https://operations.osmfoundation.org/policies/tiles/ and https://osmfoundation.org/wiki/Privacy_Policy
* OpenFreeMap provides the optional vector styles. Its service is subject to its terms and privacy policy: https://openfreemap.org/tos/ and https://openfreemap.org/privacy/
* Site administrators may configure a custom XYZ or MapLibre provider. In that case, the administrator is responsible for that provider's terms, attribution and privacy disclosures.
* Freemius provides optional licensing, updates and opt-in usage diagnostics for the commercial edition. No data is sent until the administrator accepts the Freemius opt-in: https://freemius.com/privacy/

== Privacy ==

The plugin itself does not store visitor personal data, set visitor cookies or add tracking scripts. Map providers necessarily receive network request data when their tiles or styles are loaded. Administrators should mention the selected map provider in their site's privacy policy where required.

== Frequently Asked Questions ==

= Does the default setup require an API key? =

No. OpenStreetMap and the included OpenFreeMap styles do not require an API key.

= Can one publication create several markers? =

Yes. ACF Pro Repeater rows can each provide a coordinate and optional location label.

= What does Pro add? =

Pro adds taxonomy/meta filtering, result ordering and conditional marker colors. The Free edition remains fully usable without a licence.

= Does the plugin send data to external services? =

Yes. The visitor's browser requests map tiles from the selected provider. See the External services and Privacy sections above. Freemius communication is subject to an explicit administrator opt-in.

== Changelog ==

= 0.2.2 =
* Align the source tree, documentation and release workflow with WordPress.org requirements.
* Add automated WordPress Coding Standards and Plugin Check validation.
* Document external map services, privacy behavior and third-party dependencies.

= 0.2.1 =
* Update the Freemius WordPress SDK to 2.13.5.
* Finalize paid-build takeover and public asset dependency loading.

= 0.2.0 =
* Integrate the Freemius Free/Pro release architecture.
* Consolidate ACF Repeater multi-location markers and the popup builder.
* Add OpenFreeMap vector styles, theme colors, presets and custom MapLibre styles.
* Add premium filtering, ordering and conditional marker extensions.

== Upgrade Notice ==

= 0.2.2 =
This release improves WordPress compatibility checks, packaging and privacy documentation.

= 0.2.1 =
This maintenance release updates the Freemius SDK before the first public Free/Pro deployment.

= 0.2.0 =
This release consolidates the current MapBlock features and prepares separate Free and Pro packages through Freemius.
