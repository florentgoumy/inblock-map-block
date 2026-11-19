<?php
/**
 * Plugin Name:       Inblock Map Block
 * Description:       Gutenberg block to display an OpenStreetMap and plot items from a selected post type.
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Version:           0.2.1
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

define( 'INBLOCK_MAP_BLOCK_VERSION', '0.2.1' );
define( 'INBLOCK_MAP_BLOCK_FILE', __FILE__ );

$inblock_map_block_autoload = __DIR__ . '/vendor/autoload.php';
if ( file_exists( $inblock_map_block_autoload ) ) {
	require_once $inblock_map_block_autoload;
}

// Let the paid build take ownership when it is activated alongside the free build.
if ( function_exists( 'imb_fs' ) ) {
	imb_fs()->set_basename( true, __FILE__ );
}

if ( function_exists( 'fs_dynamic_init' ) && ! function_exists( 'imb_fs' ) ) {
	/** Returns the Freemius SDK instance. */
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

if ( function_exists( 'imb_fs' ) && imb_fs()->can_use_premium_code__premium_only() ) {
	require_once __DIR__ . '/includes/pro__premium_only.php';
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

	// WordPress versions prior to the React JSX runtime handle should still load the block editor script.
	if ( ! wp_script_is( 'react-jsx-runtime', 'registered' ) ) {
		$editor_dependencies = array_values(
			array_diff( $editor_dependencies, array( 'react-jsx-runtime' ) )
		);
	}
	$editor_dependencies = apply_filters( 'inblock_map_block_editor_dependencies', $editor_dependencies );

	wp_register_script(
		'inblock-map-block-editor',
		plugins_url( 'build/index.js', __FILE__ ),
		$editor_dependencies,
		$asset['version'],
		true
	);

	wp_register_script(
		'inblock-map-block-popup-builder',
		plugins_url( 'build/popup-builder.js', __FILE__ ),
		array( 'inblock-map-block-editor', 'wp-api-fetch', 'wp-block-editor', 'wp-components', 'wp-compose', 'wp-data', 'wp-element', 'wp-hooks', 'wp-i18n' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'build/popup-builder.js' ),
		true
	);
	add_action( 'enqueue_block_editor_assets', function () { wp_enqueue_script( 'inblock-map-block-popup-builder' ); } );

	wp_register_style(
		'inblock-map-block-style',
		plugins_url( 'build/style-index.css', __FILE__ ),
		array(),
		$asset['version']
	);

	wp_register_style(
		'inblock-map-block-editor-style',
		plugins_url( 'build/index.css', __FILE__ ),
		array( 'inblock-map-block-style' ),
		$asset['version']
	);

	$view_asset_file = plugin_dir_path( __FILE__ ) . 'build/view.asset.php';
	$view_asset = file_exists( $view_asset_file ) ? require $view_asset_file : array(
		'dependencies' => array(),
		'version'      => $asset['version'],
	);
	$view_dependencies = isset( $view_asset['dependencies'] ) ? $view_asset['dependencies'] : array();
	$view_dependencies = apply_filters( 'inblock_map_block_view_dependencies', $view_dependencies );

	wp_register_style(
		'inblock-map-block-view-style',
		plugins_url( 'build/view.css', __FILE__ ),
		array( 'inblock-map-block-style' ),
		isset( $view_asset['version'] ) ? $view_asset['version'] : $asset['version']
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
		'editor_style'    => 'inblock-map-block-editor-style',
		'style'           => array( 'inblock-map-block-style', 'inblock-map-block-view-style' ),
		'view_script'     => 'inblock-map-block-view',
		'render_callback' => 'inblock_map_block_render',
	);

	$registered = register_block_type( __DIR__ . '/block.json', $registration_args );

	// Compatibility fallback: if metadata registration fails, register the block manually.
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
 * Reads marker coordinates from a content item.
 *
 * @param int    $post_id Content ID.
 * @param string $markers_source Marker source type.
 * @param string $acf_field ACF field name.
 * @param string $lat_meta_key Latitude meta key.
 * @param string $lng_meta_key Longitude meta key.
 * @return array|null
 */
function inblock_map_block_get_marker_coordinates( $post_id, $markers_source, $acf_field, $lat_meta_key, $lng_meta_key ) {
	$point_lat = null;
	$point_lng = null;

	if ( 'acf_location' === $markers_source && function_exists( 'get_field' ) ) {
		$location = get_field( $acf_field, $post_id );
		if ( is_array( $location ) && isset( $location['lat'], $location['lng'] ) ) {
			$point_lat = (float) $location['lat'];
			$point_lng = (float) $location['lng'];
		}
	} elseif ( 'acf_text_latlng' === $markers_source && function_exists( 'get_field' ) ) {
		$raw = get_field( $acf_field, $post_id );
		$coordinates = inblock_map_block_parse_latlng_text( $raw );
		if ( $coordinates ) {
			$point_lat = $coordinates['lat'];
			$point_lng = $coordinates['lng'];
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

/** Parses the legacy {latitude,longitude} text format. */
function inblock_map_block_parse_latlng_text( $raw, $strict = false ) {
	if ( ! is_string( $raw ) ) {
		return null;
	}
	$raw = trim( trim( $raw ), "{}()[]" );
	$parts = array_map( 'trim', explode( ',', $raw ) );
	if ( count( $parts ) < 2 || ( $strict && ( ! is_numeric( $parts[0] ) || ! is_numeric( $parts[1] ) ) ) ) {
		return null;
	}
	$first  = (float) $parts[0];
	$second = (float) $parts[1];
	if ( abs( $first ) > 90 && abs( $second ) <= 90 ) {
		$point_lat = $second;
		$point_lng = $first;
	} else {
		$point_lat = $first;
		$point_lng = $second;
	}
	if ( $strict && ( $point_lat < -90 || $point_lat > 90 || $point_lng < -180 || $point_lng > 180 ) ) {
		return null;
	}
	return array( 'lat' => $point_lat, 'lng' => $point_lng );
}

/** Returns every valid location stored in an ACF Repeater. */
function inblock_map_block_get_repeater_coordinates( $post_id, $repeater_field, $coordinates_field, $label_field ) {
	if ( ! function_exists( 'get_field' ) || '' === $repeater_field || '' === $coordinates_field ) {
		return array();
	}
	$rows = get_field( $repeater_field, $post_id );
	if ( ! is_array( $rows ) ) {
		return array();
	}
	$locations = array();
	foreach ( $rows as $row_index => $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}
		$coordinates_meta_key = $repeater_field . '_' . $row_index . '_' . $coordinates_field;
		$raw_coordinates = get_post_meta( $post_id, $coordinates_meta_key, true );
		if ( ! is_string( $raw_coordinates ) || '' === trim( $raw_coordinates ) ) {
			$raw_coordinates = $row[ $coordinates_field ] ?? null;
		}
		$coordinates = inblock_map_block_parse_latlng_text( $raw_coordinates, true );
		if ( ! $coordinates ) {
			continue;
		}
		$label_value = '';
		if ( '' !== $label_field ) {
			$label_meta_key = $repeater_field . '_' . $row_index . '_' . $label_field;
			$label_value = get_post_meta( $post_id, $label_meta_key, true );
			if ( '' === $label_value && isset( $row[ $label_field ] ) ) {
				$label_value = $row[ $label_field ];
			}
		}
		$coordinates['location_label'] = is_scalar( $label_value )
			? sanitize_text_field( wp_strip_all_tags( (string) $label_value ) )
			: '';
		$locations[] = $coordinates;
	}
	return $locations;
}

/**
 * Builds marker data for a single content item or a collection.
 *
 * @param string $markers_mode Marker mode.
 * @param int    $current_post_id Current content ID for single mode.
 * @param string $markers_posttype Collection post type.
 * @param string $markers_source Marker source type.
 * @param string $acf_field ACF field name.
 * @param string $lat_meta_key Latitude meta key.
 * @param string $lng_meta_key Longitude meta key.
 * @param int    $markers_limit Collection limit.
 * @return array
 */
function inblock_map_block_get_markers( $markers_mode, $current_post_id, $markers_posttype, $markers_source, $acf_field, $lat_meta_key, $lng_meta_key, $markers_limit, $repeater_field = '', $repeater_coordinates_field = '', $repeater_label_field = '', $popup_fields = array(), $attributes = array() ) {
	$post_ids = array();

	if ( 'single' === $markers_mode && $current_post_id > 0 ) {
		$post_ids[] = $current_post_id;
	} elseif ( 'collection' === $markers_mode && ! empty( $markers_posttype ) ) {
		$query_args = apply_filters(
			'inblock_map_block_query_args',
			array(
				'post_type'      => $markers_posttype,
				'post_status'    => 'publish',
				'posts_per_page' => $markers_limit,
				'no_found_rows'  => true,
				'fields'         => 'ids',
			),
			$attributes
		);
		$post_ids = get_posts( $query_args );
	}

	$markers = array();
	foreach ( $post_ids as $post_id ) {
		if ( 'acf_repeater' === $markers_source ) {
			$coordinates_list = inblock_map_block_get_repeater_coordinates( $post_id, $repeater_field, $repeater_coordinates_field, $repeater_label_field );
		} else {
			$coordinates = inblock_map_block_get_marker_coordinates( $post_id, $markers_source, $acf_field, $lat_meta_key, $lng_meta_key );
			$coordinates_list = $coordinates ? array( $coordinates ) : array();
		}

		if ( empty( $coordinates_list ) ) {
			continue;
		}

		$popup_values = array();
		foreach ( array_slice( is_array( $popup_fields ) ? $popup_fields : array(), 0, 5 ) as $popup_field ) {
			$field_source = isset( $popup_field['source'] ) ? sanitize_key( $popup_field['source'] ) : 'acf';
			if ( 'wordpress' === $field_source ) {
				$field_key = isset( $popup_field['key'] ) ? sanitize_key( $popup_field['key'] ) : '';
				$native_field = inblock_map_block_get_native_popup_field( $post_id, $field_key );
				if ( ! $native_field ) {
					continue;
				}
				$custom_label = isset( $popup_field['label'] ) ? sanitize_text_field( $popup_field['label'] ) : '';
				$popup_values[] = array(
					'source'     => 'wordpress',
					'name'       => $field_key,
					'label'      => '' !== $custom_label ? $custom_label : $native_field['label'],
					'show_label' => ! isset( $popup_field['showLabel'] ) || (bool) $popup_field['showLabel'],
					'type'       => $native_field['type'],
					'value'      => $native_field['value'],
				);
				continue;
			}

			$field_name = isset( $popup_field['name'] ) ? sanitize_key( $popup_field['name'] ) : '';
			if ( '' === $field_name || ! function_exists( 'get_field_object' ) ) {
				continue;
			}

			$field_object = get_field_object( $field_name, $post_id, true, true );
			if ( ! is_array( $field_object ) || ! inblock_map_block_is_supported_popup_field( $field_object ) ) {
				continue;
			}

			$value = inblock_map_block_format_popup_field_value( $field_object );
			if ( null === $value || '' === $value || array() === $value ) {
				continue;
			}

			$custom_label = isset( $popup_field['label'] ) ? sanitize_text_field( $popup_field['label'] ) : '';
			$popup_values[] = array(
				'source'     => 'acf',
				'name'       => $field_name,
				'label'      => '' !== $custom_label ? $custom_label : sanitize_text_field( $field_object['label'] ?? $field_name ),
				'show_label' => ! isset( $popup_field['showLabel'] ) || (bool) $popup_field['showLabel'],
				'type'       => sanitize_key( $field_object['type'] ?? 'text' ),
				'value'      => $value,
			);
		}

		foreach ( $coordinates_list as $location_index => $coordinates ) {
			$marker = array(
				'id'            => $post_id,
				'markerId'      => $post_id . '-' . $location_index,
				'title'         => get_the_title( $post_id ),
				'locationLabel' => sanitize_text_field( $coordinates['location_label'] ?? '' ),
				'url'           => get_permalink( $post_id ),
				'lat'           => $coordinates['lat'],
				'lng'           => $coordinates['lng'],
				'popupFields'   => $popup_values,
			);
			$markers[] = apply_filters( 'inblock_map_block_marker_data', $marker, $post_id, $attributes );
		}
	}

	return $markers;
}

/** Returns a compact, safe native WordPress value for a popup. */
function inblock_map_block_get_native_popup_field( $post_id, $field_key ) {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return null;
	}

	$post_type_object = get_post_type_object( $post->post_type );
	$terms = wp_get_object_terms( $post_id, get_object_taxonomies( $post->post_type ), array( 'fields' => 'names' ) );
	$term_names = is_wp_error( $terms ) ? array() : array_map( 'sanitize_text_field', $terms );

	$fields = array(
		'excerpt' => array(
			'label' => __( 'Excerpt', 'inblock-map-block' ),
			'type'  => 'text',
			'value' => wp_trim_words( wp_strip_all_tags( get_the_excerpt( $post ) ), 30, '…' ),
		),
		'featured_image' => array(
			'label' => __( 'Featured image', 'inblock-map-block' ),
			'type'  => 'image',
			'value' => ( function () use ( $post_id ) {
				$image_id = get_post_thumbnail_id( $post_id );
				$url = $image_id ? wp_get_attachment_image_url( $image_id, 'medium' ) : '';
				return $url ? array( 'url' => esc_url_raw( $url ), 'alt' => sanitize_text_field( get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ) ) : null;
			} )(),
		),
		'author' => array(
			'label' => __( 'Author', 'inblock-map-block' ),
			'type'  => 'text',
			'value' => sanitize_text_field( get_the_author_meta( 'display_name', $post->post_author ) ),
		),
		'published_date' => array(
			'label' => __( 'Published date', 'inblock-map-block' ),
			'type'  => 'text',
			'value' => sanitize_text_field( get_the_date( '', $post ) ),
		),
		'post_type' => array(
			'label' => __( 'Content type', 'inblock-map-block' ),
			'type'  => 'text',
			'value' => sanitize_text_field( $post_type_object ? $post_type_object->labels->singular_name : $post->post_type ),
		),
		'taxonomies' => array(
			'label' => __( 'Categories and terms', 'inblock-map-block' ),
			'type'  => 'text',
			'value' => implode( ', ', $term_names ),
		),
	);

	if ( ! isset( $fields[ $field_key ] ) || null === $fields[ $field_key ]['value'] || '' === $fields[ $field_key ]['value'] ) {
		return null;
	}
	return $fields[ $field_key ];
}

/** Whether an ACF field is safe and useful in a compact map popup. */
function inblock_map_block_is_supported_popup_field( $field ) {
	$unsupported = array(
		'accordion', 'clone', 'flexible_content', 'gallery', 'google_map',
		'group', 'message', 'repeater', 'tab', 'wysiwyg',
	);
	return is_array( $field ) && ! empty( $field['name'] ) && ! in_array( $field['type'] ?? '', $unsupported, true );
}

/** Formats an ACF value as plain, structured popup data. */
function inblock_map_block_format_popup_field_value( $field ) {
	$value = $field['value'] ?? null;
	$type  = $field['type'] ?? 'text';

	if ( 'image' === $type ) {
		$image_id = is_array( $value ) ? absint( $value['ID'] ?? $value['id'] ?? 0 ) : absint( $value );
		$url = $image_id ? wp_get_attachment_image_url( $image_id, 'thumbnail' ) : ( is_array( $value ) ? ( $value['sizes']['thumbnail'] ?? $value['url'] ?? '' ) : '' );
		return $url ? array( 'url' => esc_url_raw( $url ), 'alt' => sanitize_text_field( is_array( $value ) ? ( $value['alt'] ?? '' ) : '' ) ) : null;
	}

	if ( is_bool( $value ) ) {
		return $value ? __( 'Yes', 'inblock-map-block' ) : __( 'No', 'inblock-map-block' );
	}

	if ( is_array( $value ) ) {
		$labels = array();
		foreach ( $value as $item ) {
			if ( is_object( $item ) && isset( $item->name ) ) {
				$labels[] = $item->name;
			} elseif ( is_object( $item ) && isset( $item->post_title ) ) {
				$labels[] = $item->post_title;
			} elseif ( is_array( $item ) && isset( $item['label'] ) ) {
				$labels[] = $item['label'];
			} elseif ( is_scalar( $item ) ) {
				$labels[] = (string) $item;
			}
		}
		return implode( ', ', array_map( 'sanitize_text_field', $labels ) );
	}

	if ( is_object( $value ) ) {
		return sanitize_text_field( $value->name ?? $value->post_title ?? '' );
	}

	return is_scalar( $value ) ? sanitize_text_field( wp_strip_all_tags( (string) $value ) ) : null;
}

/**
 * Server-side render for the block.
 *
 * @param array $attributes Block attributes.
 * @param string $content Block content.
 * @param object $block Block instance.
 * @return string
 */
function inblock_map_block_render( $attributes, $content = '', $block = null ) {
	$lat  = isset( $attributes['lat'] ) ? (float) $attributes['lat'] : 0.0;
	$lng  = isset( $attributes['lng'] ) ? (float) $attributes['lng'] : 0.0;
	$zoom = isset( $attributes['zoom'] ) ? (int) $attributes['zoom'] : 12;

	$height = isset( $attributes['height'] ) ? (int) $attributes['height'] : 320;

	$markers_enabled  = ! empty( $attributes['markersEnabled'] );
	$markers_mode_attr = isset( $attributes['markersMode'] ) ? (string) $attributes['markersMode'] : '';
	$markers_posttype = isset( $attributes['markersPostType'] ) ? (string) $attributes['markersPostType'] : '';
	$markers_mode     = in_array( $markers_mode_attr, array( 'single', 'collection' ), true )
		? $markers_mode_attr
		: ( ! empty( $markers_posttype ) ? 'collection' : 'single' );
	$markers_source   = isset( $attributes['markersSource'] ) ? (string) $attributes['markersSource'] : 'acf_location';
	$acf_field        = isset( $attributes['acfLocationField'] ) ? (string) $attributes['acfLocationField'] : 'location';
	$repeater_field   = isset( $attributes['acfRepeaterField'] ) ? sanitize_key( $attributes['acfRepeaterField'] ) : '';
	$repeater_coordinates_field = isset( $attributes['acfRepeaterCoordinatesField'] ) ? sanitize_key( $attributes['acfRepeaterCoordinatesField'] ) : '';
	$repeater_label_field = isset( $attributes['acfRepeaterLabelField'] ) ? sanitize_key( $attributes['acfRepeaterLabelField'] ) : '';
	$lat_meta_key     = isset( $attributes['latMetaKey'] ) ? (string) $attributes['latMetaKey'] : 'inblock_lat';
	$lng_meta_key     = isset( $attributes['lngMetaKey'] ) ? (string) $attributes['lngMetaKey'] : 'inblock_lng';
	$markers_limit    = isset( $attributes['markersLimit'] ) ? (int) $attributes['markersLimit'] : 100;
	$markers_popup    = isset( $attributes['markersPopup'] ) ? (bool) $attributes['markersPopup'] : true;
	$marker_popup_show_title = ! isset( $attributes['markerPopupShowTitle'] ) || (bool) $attributes['markerPopupShowTitle'];
	$marker_popup_show_link = ! isset( $attributes['markerPopupShowLink'] ) || (bool) $attributes['markerPopupShowLink'];
	$marker_popup_link_style = isset( $attributes['markerPopupLinkStyle'] ) && 'button' === $attributes['markerPopupLinkStyle'] ? 'button' : 'link';
	$markers_autofit  = isset( $attributes['markersAutoFit'] ) ? (bool) $attributes['markersAutoFit'] : true;
	$marker_style     = isset( $attributes['markerStyle'] ) ? (string) $attributes['markerStyle'] : 'default';
	$marker_details_link_label = isset( $attributes['markerDetailsLinkLabel'] )
		? trim( (string) $attributes['markerDetailsLinkLabel'] )
		: '';
	if ( '' === $marker_details_link_label ) {
		$marker_details_link_label = __( 'Plus d’infos', 'inblock-map-block' );
	}
	$marker_popup_fields = isset( $attributes['markerPopupFields'] ) && is_array( $attributes['markerPopupFields'] )
		? array_slice( $attributes['markerPopupFields'], 0, 5 )
		: array();
	$marker_color     = isset( $attributes['markerColor'] ) ? (string) $attributes['markerColor'] : '#2563eb';
	$base_map         = isset( $attributes['baseMap'] ) ? (string) $attributes['baseMap'] : 'osm';
	$base_map_color_mode = isset( $attributes['baseMapColorMode'] ) ? (string) $attributes['baseMapColorMode'] : 'original';
	$base_map_colors = 'original' !== $base_map_color_mode && isset( $attributes['baseMapColors'] ) && is_array( $attributes['baseMapColors'] )
		? $attributes['baseMapColors']
		: array();
	$custom_base_map_enabled = ! empty( $attributes['customBaseMapEnabled'] );
	$custom_base_map_type = isset( $attributes['customBaseMapType'] ) && 'maplibre' === $attributes['customBaseMapType'] ? 'maplibre' : 'xyz';
	$custom_base_map_url = isset( $attributes['customBaseMapUrl'] ) ? (string) $attributes['customBaseMapUrl'] : '';
	$custom_maplibre_style_url = isset( $attributes['customMapLibreStyleUrl'] ) ? (string) $attributes['customMapLibreStyleUrl'] : '';
	$custom_base_map_attribution = isset( $attributes['customBaseMapAttribution'] ) ? (string) $attributes['customBaseMapAttribution'] : '';
	$markers_cluster = isset( $attributes['markersCluster'] ) ? (bool) $attributes['markersCluster'] : true;
	$markers_cluster_disable_at_zoom = isset( $attributes['markersClusterDisableAtZoom'] ) ? (int) $attributes['markersClusterDisableAtZoom'] : 18;
	$custom_marker_enabled = ! empty( $attributes['customMarkerEnabled'] );
	$custom_marker_url = isset( $attributes['customMarkerUrl'] ) ? (string) $attributes['customMarkerUrl'] : '';
	$custom_marker_width = isset( $attributes['customMarkerWidth'] ) ? (int) $attributes['customMarkerWidth'] : 32;
	$custom_marker_height = isset( $attributes['customMarkerHeight'] ) ? (int) $attributes['customMarkerHeight'] : 32;
	$custom_marker_anchor_x = isset( $attributes['customMarkerAnchorX'] ) ? (int) $attributes['customMarkerAnchorX'] : 16;
	$custom_marker_anchor_y = isset( $attributes['customMarkerAnchorY'] ) ? (int) $attributes['customMarkerAnchorY'] : 32;

	// Basic clamping (safety).
	$lat  = max( -90.0, min( 90.0, $lat ) );
	$lng  = max( -180.0, min( 180.0, $lng ) );
	$zoom = max( 1, min( 19, $zoom ) );
	$height = max( 120, min( 900, $height ) );

	$markers_limit = max( 1, min( 500, $markers_limit ) );

	$current_post_id = 0;
	if ( $markers_enabled && 'single' === $markers_mode ) {
		if ( is_object( $block ) && isset( $block->context['postId'] ) ) {
			$current_post_id = (int) $block->context['postId'];
		} else {
			$current_post_id = (int) get_the_ID();
		}
	}

	$markers = $markers_enabled
		? inblock_map_block_get_markers(
			$markers_mode,
			$current_post_id,
			$markers_posttype,
			$markers_source,
			$acf_field,
			$lat_meta_key,
			$lng_meta_key,
			$markers_limit,
			$repeater_field,
			$repeater_coordinates_field,
			$repeater_label_field,
			$marker_popup_fields,
			$attributes
		)
		: array();

	$attrs = sprintf(
		'data-lat="%s" data-lng="%s" data-zoom="%d" data-height="%d" data-markers-popup="%d" data-popup-show-title="%d" data-popup-show-link="%d" data-popup-link-style="%s" data-markers-enabled="%d" data-markers-auto-fit="%d" data-marker-style="%s" data-marker-details-link-label="%s" data-marker-color="%s" data-base-map="%s" data-base-map-colors="%s" data-custom-base-map-enabled="%d" data-custom-base-map-type="%s" data-custom-base-map-url="%s" data-custom-maplibre-style-url="%s" data-custom-base-map-attribution="%s" data-markers-cluster="%d" data-markers-cluster-disable-at-zoom="%d" data-custom-marker-enabled="%d" data-custom-marker-url="%s" data-custom-marker-width="%d" data-custom-marker-height="%d" data-custom-marker-anchor-x="%d" data-custom-marker-anchor-y="%d"',
		esc_attr( $lat ),
		esc_attr( $lng ),
		$zoom,
		$height,
		$markers_popup ? 1 : 0,
		$marker_popup_show_title ? 1 : 0,
		$marker_popup_show_link ? 1 : 0,
		esc_attr( $marker_popup_link_style ),
		$markers_enabled ? 1 : 0,
		$markers_autofit ? 1 : 0,
		esc_attr( $marker_style ),
		esc_attr( $marker_details_link_label ),
		esc_attr( $marker_color ),
		esc_attr( $base_map ),
		esc_attr( wp_json_encode( $base_map_colors ) ),
		$custom_base_map_enabled ? 1 : 0,
		esc_attr( $custom_base_map_type ),
		esc_attr( $custom_base_map_url ),
		esc_attr( $custom_maplibre_style_url ),
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

	$markers_json = wp_json_encode( $markers );
	$markers_html = '';
	if ( $markers_enabled ) {
		if ( ! is_string( $markers_json ) ) {
			$markers_json = '[]';
		}
		// Prevent accidental script termination inside JSON.
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
