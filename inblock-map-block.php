<?php
/**
 * Plugin Name:       Inblock Map Block
 * Description:       Gutenberg block to display an OpenStreetMap and plot items from a selected post type.
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Version:           0.1.0
 * Author:            Inblock
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       inblock-map-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the block assets and the block type.
 */
function inblock_map_block_register_block() {
	$asset_file = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';
	if ( ! file_exists( $asset_file ) ) {
		return;
	}
	$asset = require $asset_file;

	wp_register_script(
		'inblock-map-block-editor',
		plugins_url( 'build/index.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version'],
		true,
		esc_attr( isset(  ) ? (int)  : 320 ),
		esc_attr( isset(  ) ? (int)  : 320 ),
		esc_attr( isset(  ) ? (int)  : 320 ),
		esc_attr( isset(  ) ? (int)  : 320 )
	);

	wp_register_style(
		'inblock-map-block-style',
		plugins_url( 'build/style-index.css', __FILE__ ),
		array(),
		$asset['version']
	);

	$view_asset_file = plugin_dir_path( __FILE__ ) . 'build/view.asset.php';
	$view_asset = file_exists( $view_asset_file ) ? require $view_asset_file : array(
		'dependencies' => array(),
		'version'      => $asset['version'],
	);

	wp_register_script(
		'inblock-map-block-view',
		plugins_url( 'build/view.js', __FILE__ ),
		isset( $view_asset['dependencies'] ) ? $view_asset['dependencies'] : array(),
		isset( $view_asset['version'] ) ? $view_asset['version'] : $asset['version'],
		true
	);

	register_block_type( __DIR__ . '/block.json', array(
		'editor_script'   => 'inblock-map-block-editor',
		'style'           => 'inblock-map-block-style',
		'view_script'     => 'inblock-map-block-view',
		'render_callback' => 'inblock_map_block_render',
	) );
}
add_action( 'init', 'inblock_map_block_register_block' );

/**
 * Server-side render for the block.
 *
 * @param array $attributes Block attributes.
 * @return string
 */
function inblock_map_block_render( $attributes ) {
	$lat  = isset( $attributes['lat'] ) ? (float) $attributes['lat'] : 0.0;
	$lng  = isset( $attributes['lng'] ) ? (float) $attributes['lng'] : 0.0;
	$zoom = isset( $attributes['zoom'] ) ? (int) $attributes['zoom'] : 12;

	// Basic clamping (safety).
	$lat  = max( -90.0, min( 90.0, $lat ) );
	$lng  = max( -180.0, min( 180.0, $lng ) );
	$zoom = max( 1, min( 19, $zoom ) );

	$attrs = sprintf(
		'data-lat="%s" data-lng="%s" data-zoom="%d" data-height="%d"',
		esc_attr( $lat ),
		esc_attr( $lng ),
		$zoom,
		esc_attr( isset( $attributes['height'] ) ? (int) $attributes['height'] : 320 )
	);

	return '<div class="wp-block-inblock-map-block"><div class="inblock-map-block__map" ' . $attrs . '></div></div>';
}

