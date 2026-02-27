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
		true
	);

	register_block_type( 'inblock/map-block', array(
		'editor_script' => 'inblock-map-block-editor',
	) );
}
add_action( 'init', 'inblock_map_block_register_block' );
