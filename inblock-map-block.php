<?php
/**
 * Plugin Name:       Inblock Map Block
 * Description:       Lightweight Gutenberg map block for dynamic WordPress content.
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Version:           0.2.0
 * Author:            Inblock
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       inblock-map-block
 *
 * @fs_ignore /vendor/
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'INBLOCK_MAP_BLOCK_VERSION', '0.2.0' );
define( 'INBLOCK_MAP_BLOCK_FILE', __FILE__ );

$inblock_map_block_autoload = __DIR__ . '/vendor/autoload.php';
if ( file_exists( $inblock_map_block_autoload ) ) {
	require_once $inblock_map_block_autoload;
}

if ( function_exists( 'fs_dynamic_init' ) && ! function_exists( 'imb_fs' ) ) {
	/**
	 * Returns the Freemius SDK instance for Inblock Map Block.
	 *
	 * @return Freemius
	 */
	function imb_fs() {
		global $imb_fs;

		if ( ! isset( $imb_fs ) ) {
			$imb_fs = fs_dynamic_init(
				array(
					'id'                  => '40192',
					'slug'                => 'inblock-map-block',
					'type'                => 'plugin',
					'public_key'          => 'pk_5910ba94d34f62948ba4a4fbbdb5a',
					'is_premium'          => true,
					'premium_suffix'      => 'Pro',
					'has_premium_version' => true,
					'has_addons'          => false,
					'has_paid_plans'      => true,
					'is_org_compliant'    => true,
					'wp_org_gatekeeper'   => 'OA7#BoRiBNqdf52FvzEf!!074aRLPs8fspif$7K1#4u4Csys1fQlCecVcUTOs2mcpeVHi#C2j9d09fOTvbC0HloPT7fFee5WdS3G',
					'menu'                => array(
						'first-path' => 'plugins.php',
						'support'    => false,
					),
				)
			);
		}

		return $imb_fs;
	}

	imb_fs();
	do_action( 'imb_fs_loaded' );
}

require_once __DIR__ . '/includes/rest.php';

if ( function_exists( 'imb_fs' ) ) {
	if ( imb_fs()->can_use_premium_code__premium_only() ) {
		require_once __DIR__ . '/includes/pro__premium_only.php';
	}
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
	$editor_dependencies = isset( $asset['dependencies'] ) && is_array( $asset['dependencies'] )
		? $asset['dependencies']
		: array();

	if ( ! wp_script_is( 'react-jsx-runtime', 'registered' ) ) {
		$editor_dependencies = array_values(
			array_diff( $editor_dependencies, array( 'react-jsx-runtime' ) )
		);
	}

	$editor_dependencies = apply_filters(
		'inblock_map_block_editor_dependencies',
		$editor_dependencies
	);

	wp_register_script(
		'inblock-map-block-editor',
		plugins_url( 'build/index.js', __FILE__ ),
		$editor_dependencies,
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

	$view_dependencies = isset( $view_asset['dependencies'] ) && is_array( $view_asset['dependencies'] )
		? $view_asset['dependencies']
		: array();

	$view_dependencies = apply_filters(
		'inblock_map_block_view_dependencies',
		$view_dependencies
	);

	wp_register_script(
		'inblock-map-block-view',
		plugins_url( 'build/view.js', __FILE__ ),
		$view_dependencies,
		isset( $view_asset['version'] ) ? $view_asset['version'] : $asset['version'],
		true
	);

	$registration_args = array(
		'editor_script'   => 'inblock-map-block-editor',
		'style'           => 'inblock-map-block-style',
		'view_script'     => 'inblock-map-block-view',
		'render_callback' => 'inblock_map_block_render',
	);

	$registered = register_block_type( __DIR__ . '/block.json', $registration_args );

	if ( ! $registered || is_wp_error( $registered ) ) {
		$supports = array(
			'html'   => false,
			'border' => array(
				'color'  => true,
				'radius' => true,
				'style'  => true,
				'width'  => true,
			),
		);

		if ( version_compare( get_bloginfo( 'version' ), '6.5', '>=' ) ) {
			$supports['shadow'] = true;
		}

		register_block_type(
			'inblock/map-block',
			array_merge(
				$registration_args,
				array(
					'api_version' => 3,
					'title'       => __( 'Inblock Map Block', 'inblock-map-block' ),
					'category'    => 'widgets',
					'icon'        => 'location',
					'supports'    => $supports,
				)
			)
		);
	}
}
add_action( 'init', 'inblock_map_block_register_block' );

/**
 * Reads coordinates for a post from the configured marker source.
 *
 * @param int    $post_id        Post ID.
 * @param string $markers_source Marker source.
 * @param string $acf_field      ACF field name.
 * @param string $lat_meta_key   Latitude meta key.
 * @param string $lng_meta_key   Longitude meta key.
 * @return array|null
 */
function inblock_map_block_get_post_coordinates( $post_id, $markers_source, $acf_field, $lat_meta_key, $lng_meta_key ) {
	$point_lat = null;
	$point_lng = null;

	if ( 'acf_location' === $markers_source && function_exists( 'get_field' ) ) {
		$loc = get_field( $acf_field, $post_id );
		if ( is_array( $loc ) && isset( $loc['lat'], $loc['lng'] ) ) {
			$point_lat = (float) $loc['lat'];
			$point_lng = (float) $loc['lng'];
		}
	} elseif ( 'acf_text_latlng' === $markers_source && function_exists( 'get_field' ) ) {
		$raw = get_field( $acf_field, $post_id );
		if ( is_string( $raw ) ) {
			$raw   = trim( trim( $raw ), '{}()[]' );
			$parts = array_map( 'trim', explode( ',', $raw ) );

			if ( count( $parts ) >= 2 ) {
				$a = (float) $parts[0];
				$b = (float) $parts[1];

				if ( abs( $a ) > 90 && abs( $b ) <= 90 ) {
					$point_lat = $b;
					$point_lng = $a;
				} else {
					$point_lat = $a;
					$point_lng = $b;
				}
			}
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
		return null;
	}

	return array(
		'lat' => max( -90.0, min( 90.0, $point_lat ) ),
		'lng' => max( -180.0, min( 180.0, $point_lng ) ),
	);
}

/**
 * Server-side render for the block.
 *
 * @param array $attributes Block attributes.
 * @return string
 */
function inblock_map_block_render( $attributes ) {
	$lat    = isset( $attributes['lat'] ) ? (float) $attributes['lat'] : 0.0;
	$lng    = isset( $attributes['lng'] ) ? (float) $attributes['lng'] : 0.0;
	$zoom   = isset( $attributes['zoom'] ) ? (int) $attributes['zoom'] : 12;
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
	$marker_style     = isset( $attributes['markerStyle'] ) ? (string) $attributes['markerStyle'] : 'default';
	$marker_color     = isset( $attributes['markerColor'] ) ? (string) $attributes['markerColor'] : '#2563eb';
	$base_map         = isset( $attributes['baseMap'] ) ? (string) $attributes['baseMap'] : 'osm';

	$custom_base_map_enabled     = ! empty( $attributes['customBaseMapEnabled'] );
	$custom_base_map_url         = isset( $attributes['customBaseMapUrl'] ) ? (string) $attributes['customBaseMapUrl'] : '';
	$custom_base_map_attribution = isset( $attributes['customBaseMapAttribution'] ) ? (string) $attributes['customBaseMapAttribution'] : '';

	$markers_cluster                 = isset( $attributes['markersCluster'] ) ? (bool) $attributes['markersCluster'] : true;
	$markers_cluster_disable_at_zoom = isset( $attributes['markersClusterDisableAtZoom'] ) ? (int) $attributes['markersClusterDisableAtZoom'] : 18;

	$custom_marker_enabled  = ! empty( $attributes['customMarkerEnabled'] );
	$custom_marker_url      = isset( $attributes['customMarkerUrl'] ) ? (string) $attributes['customMarkerUrl'] : '';
	$custom_marker_width    = isset( $attributes['customMarkerWidth'] ) ? (int) $attributes['customMarkerWidth'] : 32;
	$custom_marker_height   = isset( $attributes['customMarkerHeight'] ) ? (int) $attributes['customMarkerHeight'] : 32;
	$custom_marker_anchor_x = isset( $attributes['customMarkerAnchorX'] ) ? (int) $attributes['customMarkerAnchorX'] : 16;
	$custom_marker_anchor_y = isset( $attributes['customMarkerAnchorY'] ) ? (int) $attributes['customMarkerAnchorY'] : 32;

	$lat           = max( -90.0, min( 90.0, $lat ) );
	$lng           = max( -180.0, min( 180.0, $lng ) );
	$zoom          = max( 1, min( 19, $zoom ) );
	$height        = max( 120, min( 900, $height ) );
	$markers_limit = max( 1, min( 500, $markers_limit ) );

	$markers = array();

	if ( $markers_enabled && ! empty( $markers_posttype ) ) {
		$query_args = array(
			'post_type'      => sanitize_key( $markers_posttype ),
			'post_status'    => 'publish',
			'posts_per_page' => $markers_limit,
			'no_found_rows'  => true,
		);

		/**
		 * Filters marker query arguments.
		 *
		 * Premium extensions use this hook without adding premium logic to the Free build.
		 *
		 * @param array $query_args Query arguments.
		 * @param array $attributes Block attributes.
		 */
		$query_args = apply_filters( 'inblock_map_block_query_args', $query_args, $attributes );

		$query = new WP_Query( $query_args );

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$post_id = get_the_ID();

				$coordinates = inblock_map_block_get_post_coordinates(
					$post_id,
					$markers_source,
					$acf_field,
					$lat_meta_key,
					$lng_meta_key
				);

				if ( ! $coordinates ) {
					continue;
				}

				$marker = array(
					'id'    => $post_id,
					'title' => get_the_title( $post_id ),
					'url'   => get_permalink( $post_id ),
					'lat'   => $coordinates['lat'],
					'lng'   => $coordinates['lng'],
				);

				/**
				 * Filters marker data before it is serialized for the front end.
				 *
				 * @param array $marker     Marker data.
				 * @param int   $post_id    Post ID.
				 * @param array $attributes Block attributes.
				 */
				$markers[] = apply_filters( 'inblock_map_block_marker_data', $marker, $post_id, $attributes );
			}

			wp_reset_postdata();
		}
	}

	$attrs = sprintf(
		'data-lat="%s" data-lng="%s" data-zoom="%d" data-height="%d" data-markers-popup="%d" data-markers-enabled="%d" data-markers-auto-fit="%d" data-marker-style="%s" data-marker-color="%s" data-base-map="%s" data-custom-base-map-enabled="%d" data-custom-base-map-url="%s" data-custom-base-map-attribution="%s" data-markers-cluster="%d" data-markers-cluster-disable-at-zoom="%d" data-custom-marker-enabled="%d" data-custom-marker-url="%s" data-custom-marker-width="%d" data-custom-marker-height="%d" data-custom-marker-anchor-x="%d" data-custom-marker-anchor-y="%d"',
		esc_attr( $lat ),
		esc_attr( $lng ),
		$zoom,
		$height,
		$markers_popup ? 1 : 0,
		$markers_enabled ? 1 : 0,
		$markers_autofit ? 1 : 0,
		esc_attr( $marker_style ),
		esc_attr( $marker_color ),
		esc_attr( $base_map ),
		$custom_base_map_enabled ? 1 : 0,
		esc_attr( $custom_base_map_url ),
		esc_attr( $custom_base_map_attribution ),
		$markers_cluster ? 1 : 0,
		$markers_cluster_disable_at_zoom,
		$custom_marker_enabled ? 1 : 0,
		esc_attr( $custom_marker_url ),
		$custom_marker_width,
		$custom_marker_height,
		$custom_marker_anchor_x,
		$custom_marker_anchor_y
	);

	$markers_html = '';
	if ( $markers_enabled ) {
		$markers_json = wp_json_encode( $markers );
		if ( ! is_string( $markers_json ) ) {
			$markers_json = '[]';
		}

		$markers_json = str_replace( '</script', '<\/script', $markers_json );
		$markers_html = '<script type="application/json" class="inblock-map-block__markers">' . $markers_json . '</script>';
	}

	if ( function_exists( 'get_block_wrapper_attributes' ) ) {
		$wrapper_attributes = get_block_wrapper_attributes(
			array(
				'class' => 'wp-block-inblock-map-block',
			)
		);
	} else {
		$wrapper_attributes = 'class="wp-block-inblock-map-block"';
	}

	return '<div ' . $wrapper_attributes . '><div class="inblock-map-block__map" ' . $attrs . '></div>' . $markers_html . '</div>';
}
