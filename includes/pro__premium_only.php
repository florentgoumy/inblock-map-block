<?php
/**
 * Premium features for Inblock Map Block.
 *
 * This file is removed automatically from the Free package by Freemius.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


/**
 * Registers premium editor and front-end assets.
 */
function inblock_map_block_pro_register_assets__premium_only() {
	$editor_asset_file = plugin_dir_path( INBLOCK_MAP_BLOCK_FILE ) . 'build/pro-edit__premium_only.asset.php';
	$editor_asset = file_exists( $editor_asset_file )
		? require $editor_asset_file
		: array(
			'dependencies' => array(),
			'version'      => INBLOCK_MAP_BLOCK_VERSION,
		);

	wp_register_script(
		'inblock-map-block-pro-editor',
		plugins_url( 'build/pro-edit__premium_only.js', INBLOCK_MAP_BLOCK_FILE ),
		isset( $editor_asset['dependencies'] ) ? $editor_asset['dependencies'] : array(),
		isset( $editor_asset['version'] ) ? $editor_asset['version'] : INBLOCK_MAP_BLOCK_VERSION,
		true
	);

	$view_asset_file = plugin_dir_path( INBLOCK_MAP_BLOCK_FILE ) . 'build/pro-view__premium_only.asset.php';
	$view_asset = file_exists( $view_asset_file )
		? require $view_asset_file
		: array(
			'dependencies' => array(),
			'version'      => INBLOCK_MAP_BLOCK_VERSION,
		);

	wp_register_script(
		'inblock-map-block-pro-view',
		plugins_url( 'build/pro-view__premium_only.js', INBLOCK_MAP_BLOCK_FILE ),
		isset( $view_asset['dependencies'] ) ? $view_asset['dependencies'] : array(),
		isset( $view_asset['version'] ) ? $view_asset['version'] : INBLOCK_MAP_BLOCK_VERSION,
		true
	);
}
add_action( 'init', 'inblock_map_block_pro_register_assets__premium_only', 5 );

/**
 * Loads premium editor code before the core editor bundle.
 *
 * @param array $dependencies Core editor dependencies.
 * @return array
 */
function inblock_map_block_pro_editor_dependencies__premium_only( $dependencies ) {
	$dependencies[] = 'inblock-map-block-pro-editor';
	return array_values( array_unique( $dependencies ) );
}
add_filter( 'inblock_map_block_editor_dependencies', 'inblock_map_block_pro_editor_dependencies__premium_only' );

/**
 * Loads premium front-end code before the core view bundle.
 *
 * @param array $dependencies Core view dependencies.
 * @return array
 */
function inblock_map_block_pro_view_dependencies__premium_only( $dependencies ) {
	$dependencies[] = 'inblock-map-block-pro-view';
	return array_values( array_unique( $dependencies ) );
}
add_filter( 'inblock_map_block_view_dependencies', 'inblock_map_block_pro_view_dependencies__premium_only' );

/**
 * Adds premium-only block attributes on the server.
 *
 * @param array  $args       Block registration arguments.
 * @param string $block_type Block name.
 * @return array
 */
function inblock_map_block_pro_register_attributes__premium_only( $args, $block_type ) {
	if ( 'inblock/map-block' !== $block_type ) {
		return $args;
	}

	$premium_attributes = array(
		'proTaxonomy' => array(
			'type'    => 'string',
			'default' => '',
		),
		'proTerm' => array(
			'type'    => 'string',
			'default' => '',
		),
		'proMetaKey' => array(
			'type'    => 'string',
			'default' => '',
		),
		'proMetaValue' => array(
			'type'    => 'string',
			'default' => '',
		),
		'proOrderBy' => array(
			'type'    => 'string',
			'default' => 'date',
		),
		'proOrder' => array(
			'type'    => 'string',
			'default' => 'DESC',
		),
		'proPopupImage' => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'proPopupExcerpt' => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'proPopupMetaKeys' => array(
			'type'    => 'string',
			'default' => '',
		),
		'proMarkerColorTaxonomy' => array(
			'type'    => 'string',
			'default' => '',
		),
		'proMarkerColorRules' => array(
			'type'    => 'string',
			'default' => '',
		),
	);

	if ( empty( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
		$args['attributes'] = array();
	}

	$args['attributes'] = array_merge( $args['attributes'], $premium_attributes );

	return $args;
}
add_filter( 'register_block_type_args', 'inblock_map_block_pro_register_attributes__premium_only', 10, 2 );

/**
 * Extends the marker query with premium filters.
 *
 * @param array $query_args Query arguments.
 * @param array $attributes Block attributes.
 * @return array
 */
function inblock_map_block_pro_query_args__premium_only( $query_args, $attributes ) {
	$taxonomy = isset( $attributes['proTaxonomy'] ) ? sanitize_key( $attributes['proTaxonomy'] ) : '';
	$term     = isset( $attributes['proTerm'] ) ? sanitize_title( $attributes['proTerm'] ) : '';

	if ( $taxonomy && $term && taxonomy_exists( $taxonomy ) ) {
		$query_args['tax_query'] = array(
			array(
				'taxonomy' => $taxonomy,
				'field'    => 'slug',
				'terms'    => array( $term ),
			),
		);
	}

	$meta_key   = isset( $attributes['proMetaKey'] ) ? sanitize_key( $attributes['proMetaKey'] ) : '';
	$meta_value = isset( $attributes['proMetaValue'] ) ? sanitize_text_field( $attributes['proMetaValue'] ) : '';

	if ( $meta_key ) {
		$query_args['meta_key'] = $meta_key;

		if ( '' !== $meta_value ) {
			$query_args['meta_query'] = array(
				array(
					'key'     => $meta_key,
					'value'   => $meta_value,
					'compare' => '=',
				),
			);
		}
	}

	$allowed_orderby = array( 'date', 'title', 'menu_order', 'modified', 'rand' );
	$orderby = isset( $attributes['proOrderBy'] ) ? sanitize_key( $attributes['proOrderBy'] ) : 'date';
	$order   = isset( $attributes['proOrder'] ) ? strtoupper( sanitize_text_field( $attributes['proOrder'] ) ) : 'DESC';

	if ( in_array( $orderby, $allowed_orderby, true ) ) {
		$query_args['orderby'] = $orderby;
	}

	$query_args['order'] = 'ASC' === $order ? 'ASC' : 'DESC';

	return $query_args;
}
add_filter( 'inblock_map_block_query_args', 'inblock_map_block_pro_query_args__premium_only', 10, 2 );

/**
 * Parses conditional marker color rules.
 *
 * Format: one rule per line, e.g. "restaurant=#e11d48".
 *
 * @param string $raw Rules string.
 * @return array
 */
function inblock_map_block_pro_parse_color_rules__premium_only( $raw ) {
	$rules = array();

	foreach ( preg_split( '/\r\n|\r|\n/', (string) $raw ) as $line ) {
		$parts = array_map( 'trim', explode( '=', $line, 2 ) );
		if ( 2 !== count( $parts ) ) {
			continue;
		}

		$term_slug = sanitize_title( $parts[0] );
		$color     = sanitize_hex_color( $parts[1] );

		if ( $term_slug && $color ) {
			$rules[ $term_slug ] = $color;
		}
	}

	return $rules;
}

/**
 * Enriches marker JSON for premium popups and conditional styles.
 *
 * @param array $marker     Marker data.
 * @param int   $post_id    Post ID.
 * @param array $attributes Block attributes.
 * @return array
 */
function inblock_map_block_pro_marker_data__premium_only( $marker, $post_id, $attributes ) {
	if ( ! empty( $attributes['proPopupImage'] ) ) {
		$image = get_the_post_thumbnail_url( $post_id, 'medium' );
		if ( $image ) {
			$marker['proImage'] = esc_url_raw( $image );
		}
	}

	if ( ! empty( $attributes['proPopupExcerpt'] ) ) {
		$excerpt = get_the_excerpt( $post_id );
		if ( $excerpt ) {
			$marker['proExcerpt'] = wp_trim_words( wp_strip_all_tags( $excerpt ), 32 );
		}
	}

	$meta_keys = isset( $attributes['proPopupMetaKeys'] ) ? (string) $attributes['proPopupMetaKeys'] : '';
	if ( $meta_keys ) {
		$marker['proMeta'] = array();

		foreach ( array_filter( array_map( 'trim', explode( ',', $meta_keys ) ) ) as $raw_key ) {
			$key = sanitize_key( $raw_key );
			if ( ! $key ) {
				continue;
			}

			$value = get_post_meta( $post_id, $key, true );
			if ( is_scalar( $value ) && '' !== (string) $value ) {
				$marker['proMeta'][ $key ] = sanitize_text_field( (string) $value );
			}
		}
	}

	$taxonomy = isset( $attributes['proMarkerColorTaxonomy'] ) ? sanitize_key( $attributes['proMarkerColorTaxonomy'] ) : '';
	$rules    = inblock_map_block_pro_parse_color_rules__premium_only(
		isset( $attributes['proMarkerColorRules'] ) ? $attributes['proMarkerColorRules'] : ''
	);

	if ( $taxonomy && $rules && taxonomy_exists( $taxonomy ) ) {
		$terms = get_the_terms( $post_id, $taxonomy );
		if ( is_array( $terms ) ) {
			foreach ( $terms as $term ) {
				if ( isset( $rules[ $term->slug ] ) ) {
					$marker['proMarkerColor'] = $rules[ $term->slug ];
					break;
				}
			}
		}
	}

	return $marker;
}
add_filter( 'inblock_map_block_marker_data', 'inblock_map_block_pro_marker_data__premium_only', 10, 3 );
