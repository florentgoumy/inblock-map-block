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

	register_block_type(
		__DIR__ . '/block.json',
		array(
			'editor_script'   => 'inblock-map-block-editor',
			'style'           => 'inblock-map-block-style',
			'view_script'     => 'inblock-map-block-view',
			'render_callback' => 'inblock_map_block_render',
		)
	);
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

	$height = isset( $attributes['height'] ) ? (int) $attributes['height'] : 320;

	$markers_enabled  = ! empty( $attributes['markersEnabled'] );
	$markers_posttype = isset( $attributes['markersPostType'] ) ? (string) $attributes['markersPostType'] : '';
	$markers_source   = isset( $attributes['markersSource'] ) ? (string) $attributes['markersSource'] : 'acf_location';
	$acf_field        = isset( $attributes['acfLocationField'] ) ? (string) $attributes['acfLocationField'] : 'location';
	$lat_meta_key     = isset( $attributes['latMetaKey'] ) ? (string) $attributes['latMetaKey'] : 'inblock_lat';
	$lng_meta_key     = isset( $attributes['lngMetaKey'] ) ? (string) $attributes['lngMetaKey'] : 'inblock_lng';
	$markers_limit    = isset( $attributes['markersLimit'] ) ? (int) $attributes['markersLimit'] : 100;
	$markers_popup    = isset( $attributes['markersPopup'] ) ? (bool) $attributes['markersPopup'] : true;
	$markers_autofit  = isset( $attributes['markersAutoFit'] ) ? (bool) $attributes['markersAutoFit'] : true;

	// Basic clamping (safety).
	$lat  = max( -90.0, min( 90.0, $lat ) );
	$lng  = max( -180.0, min( 180.0, $lng ) );
	$zoom = max( 1, min( 19, $zoom ) );
	$height = max( 120, min( 900, $height ) );

	$markers_limit = max( 1, min( 500, $markers_limit ) );

	$markers = array();

	if ( $markers_enabled && ! empty( $markers_posttype ) ) {
		$query = new WP_Query(
			array(
				'post_type'      => $markers_posttype,
				'post_status'    => 'publish',
				'posts_per_page' => $markers_limit,
				'no_found_rows'  => true,
			)
		);

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$post_id = get_the_ID();

				$point_lat = null;
				$point_lng = null;

				if ( 'acf_location' === $markers_source && function_exists( 'get_field' ) ) {
					$loc = get_field( $acf_field, $post_id );
					if ( is_array( $loc ) && isset( $loc['lat'], $loc['lng'] ) ) {
						$point_lat = (float) $loc['lat'];
						$point_lng = (float) $loc['lng'];
					}
				} elseif ( 'meta_latlng' === $markers_source ) {
					$meta_lat = get_post_meta( $post_id, $lat_meta_key, true );
					$meta_lng = get_post_meta( $post_id, $lng_meta_key, true );
					if ( '' !== $meta_lat && '' !== $meta_lng ) {
						$point_lat = (float) $meta_lat;
						$point_lng = (float) $meta_lng;
					}
				}

				if ( null === $point_lat || null === $point_lng ) {
					continue;
				}

				// Clamp point.
				$point_lat = max( -90.0, min( 90.0, $point_lat ) );
				$point_lng = max( -180.0, min( 180.0, $point_lng ) );

				$markers[] = array(
					'id'    => $post_id,
					'title' => get_the_title( $post_id ),
					'url'   => get_permalink( $post_id ),
					'lat'   => $point_lat,
					'lng'   => $point_lng,
				);
			}
			wp_reset_postdata();
		}
	}

	$attrs = sprintf(
		'data-lat="%s" data-lng="%s" data-zoom="%d" data-height="%d" data-markers-popup="%d" data-markers-auto-fit="%d"',
		esc_attr( $lat ),
		esc_attr( $lng ),
		$zoom,
		$height,
		$markers_popup ? 1 : 0,
		$markers_autofit ? 1 : 0
	);

	$markers_json = wp_json_encode( $markers );
	$markers_html = '';
	if ( is_string( $markers_json ) && ! empty( $markers ) ) {
		$markers_html = '<script type="application/json" class="inblock-map-block__markers">' . esc_html( $markers_json ) . '</script>';
	}

	return '<div class="wp-block-inblock-map-block"><div class="inblock-map-block__map" ' . $attrs . '></div>' . $markers_html . '</div>';
}
