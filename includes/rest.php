<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function inblock_map_block_register_rest_routes() {
	register_rest_route(
		'inblock-map-block/v1',
		'/acf-repeater-fields',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => function () { return current_user_can( 'edit_posts' ); },
			'callback'            => function ( $request ) {
				if ( ! function_exists( 'acf_get_field_groups' ) || ! function_exists( 'acf_get_fields' ) ) {
					return rest_ensure_response( array() );
				}
				$post_id = absint( $request->get_param( 'post_id' ) );
				$post_type = sanitize_key( (string) $request->get_param( 'post_type' ) );
				if ( ! $post_type && $post_id ) { $post_type = get_post_type( $post_id ); }
				$out = array();
				foreach ( acf_get_field_groups( array( 'post_type' => $post_type, 'post_id' => $post_id ) ) as $group ) {
					foreach ( acf_get_fields( $group ) ?: array() as $field ) {
						if ( 'repeater' !== ( $field['type'] ?? '' ) || empty( $field['name'] ) ) { continue; }
						$sub_fields = array();
						foreach ( $field['sub_fields'] ?? array() as $sub_field ) {
							if ( empty( $sub_field['name'] ) || in_array( $sub_field['type'] ?? '', array( 'accordion', 'clone', 'flexible_content', 'group', 'message', 'repeater', 'tab' ), true ) ) { continue; }
							$sub_fields[] = array( 'name' => $sub_field['name'], 'label' => $sub_field['label'], 'type' => $sub_field['type'] );
						}
						$out[] = array( 'name' => $field['name'], 'label' => $field['label'], 'subFields' => $sub_fields );
					}
				}
				return rest_ensure_response( $out );
			},
		)
	);

	register_rest_route(
		'inblock-map-block/v1',
		'/acf-popup-fields',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => function () { return current_user_can( 'edit_posts' ); },
			'callback'            => function ( $request ) {
				if ( ! function_exists( 'acf_get_field_groups' ) || ! function_exists( 'acf_get_fields' ) ) {
					return rest_ensure_response( array() );
				}
				$post_id = absint( $request->get_param( 'post_id' ) );
				$post_type = sanitize_key( (string) $request->get_param( 'post_type' ) );
				if ( ! $post_type && $post_id ) { $post_type = get_post_type( $post_id ); }
				$groups = acf_get_field_groups( array( 'post_type' => $post_type, 'post_id' => $post_id ) );
				$out = array();
				foreach ( $groups as $group ) {
					foreach ( acf_get_fields( $group ) ?: array() as $field ) {
						if ( inblock_map_block_is_supported_popup_field( $field ) ) {
							$out[] = array( 'name' => $field['name'], 'label' => $field['label'], 'type' => $field['type'] );
						}
					}
				}
				return rest_ensure_response( array_values( array_unique( $out, SORT_REGULAR ) ) );
			},
		)
	);

	register_rest_route(
		'inblock-map-block/v1',
		'/post-types',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
			'callback'            => function () {
				$types = get_post_types(
					array(
						'show_ui'            => true,
						'public'             => true,
						'publicly_queryable' => true,
					),
					'objects'
				);

				$out = array();
				foreach ( $types as $slug => $obj ) {
					// Keep queryable editorial content and drop technical types.
					if ( 0 === strpos( $slug, 'wp_' ) ) {
						continue;
					}
					if ( in_array( $slug, array( 'attachment', 'page', 'revision', 'nav_menu_item' ), true ) ) {
						continue;
					}
					if ( ! isset( $obj->cap->edit_posts ) || ! current_user_can( $obj->cap->edit_posts ) ) {
						continue;
					}

					$out[] = array(
						'slug'  => $slug,
						'label' => $obj->labels->name ?? $obj->label ?? $slug,
					);
				}

				usort(
					$out,
					function ( $a, $b ) {
						return strcmp( $a['label'], $b['label'] );
					}
				);

				return rest_ensure_response( $out );
			},
		)
	);

	register_rest_route(
		'inblock-map-block/v1',
		'/markers',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
			'callback'            => function ( $request ) {
				$mode = sanitize_key( (string) $request->get_param( 'mode' ) );
				$mode = in_array( $mode, array( 'single', 'collection' ), true ) ? $mode : 'single';

				$post_id   = absint( $request->get_param( 'post_id' ) );
				$post_type = sanitize_key( (string) $request->get_param( 'post_type' ) );
				$source    = sanitize_key( (string) $request->get_param( 'source' ) );
				$acf_field = sanitize_key( (string) $request->get_param( 'acf_field' ) );
				$repeater_field = sanitize_key( (string) $request->get_param( 'repeater_field' ) );
				$repeater_coordinates_field = sanitize_key( (string) $request->get_param( 'repeater_coordinates_field' ) );
				$repeater_label_field = sanitize_key( (string) $request->get_param( 'repeater_label_field' ) );
				$lat_key   = sanitize_key( (string) $request->get_param( 'lat_meta_key' ) );
				$lng_key   = sanitize_key( (string) $request->get_param( 'lng_meta_key' ) );
				$limit     = max( 1, min( 500, absint( $request->get_param( 'limit' ) ) ) );
				$popup_fields = json_decode( (string) $request->get_param( 'popup_fields' ), true );
				$popup_fields = is_array( $popup_fields ) ? array_slice( $popup_fields, 0, 5 ) : array();

				if ( 'single' === $mode && ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) ) {
					return new WP_Error(
						'inblock_map_block_invalid_post',
						__( 'The current content cannot be previewed.', 'inblock-map-block' ),
						array( 'status' => 403 )
					);
				}

				if ( 'collection' === $mode ) {
					$post_type_object = get_post_type_object( $post_type );
					if (
						! $post_type_object ||
						! $post_type_object->publicly_queryable ||
						! isset( $post_type_object->cap->edit_posts ) ||
						! current_user_can( $post_type_object->cap->edit_posts )
					) {
						return new WP_Error(
							'inblock_map_block_invalid_post_type',
							__( 'This content type cannot be previewed.', 'inblock-map-block' ),
							array( 'status' => 403 )
						);
					}
				}

				$markers = inblock_map_block_get_markers(
					$mode,
					$post_id,
					$post_type,
					$source,
					$acf_field,
					$lat_key,
					$lng_key,
					$limit,
					$repeater_field,
					$repeater_coordinates_field,
					$repeater_label_field,
					$popup_fields
				);

				return rest_ensure_response( $markers );
			},
		)
	);
}
add_action( 'rest_api_init', 'inblock_map_block_register_rest_routes' );
