<?php
/**
 * REST API endpoints used by the block editor.
 *
 * @package InblockMapBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Checks whether the current user may access editor preview data.
 *
 * @return bool
 */
function inblock_map_block_rest_can_edit_posts() {
	return current_user_can( 'edit_posts' );
}

/**
 * Returns the post context requested by an editor endpoint.
 *
 * @param WP_REST_Request $request REST request.
 * @return array{post_id:int,post_type:string}
 */
function inblock_map_block_rest_get_post_context( $request ) {
	$post_id   = absint( $request->get_param( 'post_id' ) );
	$post_type = sanitize_key( (string) $request->get_param( 'post_type' ) );

	if ( ! $post_type && $post_id ) {
		$post_type = (string) get_post_type( $post_id );
	}

	return array(
		'post_id'   => $post_id,
		'post_type' => $post_type,
	);
}

/**
 * Returns ACF Repeater fields available for the selected content type.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response
 */
function inblock_map_block_rest_get_acf_repeater_fields( $request ) {
	if ( ! function_exists( 'acf_get_field_groups' ) || ! function_exists( 'acf_get_fields' ) ) {
		return rest_ensure_response( array() );
	}

	$context = inblock_map_block_rest_get_post_context( $request );
	$fields  = array();
	$groups  = acf_get_field_groups(
		array(
			'post_type' => $context['post_type'],
			'post_id'   => $context['post_id'],
		)
	);

	foreach ( $groups as $group ) {
		foreach ( acf_get_fields( $group ) ?: array() as $field ) {
			if ( 'repeater' !== ( $field['type'] ?? '' ) || empty( $field['name'] ) ) {
				continue;
			}

			$sub_fields = array();
			foreach ( $field['sub_fields'] ?? array() as $sub_field ) {
				$unsupported_types = array( 'accordion', 'clone', 'flexible_content', 'group', 'message', 'repeater', 'tab' );
				if ( empty( $sub_field['name'] ) || in_array( $sub_field['type'] ?? '', $unsupported_types, true ) ) {
					continue;
				}

				$sub_fields[] = array(
					'name'  => sanitize_key( $sub_field['name'] ),
					'label' => sanitize_text_field( $sub_field['label'] ?? $sub_field['name'] ),
					'type'  => sanitize_key( $sub_field['type'] ?? 'text' ),
				);
			}

			$fields[] = array(
				'name'      => sanitize_key( $field['name'] ),
				'label'     => sanitize_text_field( $field['label'] ?? $field['name'] ),
				'subFields' => $sub_fields,
			);
		}
	}

	return rest_ensure_response( $fields );
}

/**
 * Returns ACF fields supported by the popup builder.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response
 */
function inblock_map_block_rest_get_acf_popup_fields( $request ) {
	if ( ! function_exists( 'acf_get_field_groups' ) || ! function_exists( 'acf_get_fields' ) ) {
		return rest_ensure_response( array() );
	}

	$context = inblock_map_block_rest_get_post_context( $request );
	$groups  = acf_get_field_groups(
		array(
			'post_type' => $context['post_type'],
			'post_id'   => $context['post_id'],
		)
	);
	$fields  = array();

	foreach ( $groups as $group ) {
		foreach ( acf_get_fields( $group ) ?: array() as $field ) {
			if ( ! inblock_map_block_is_supported_popup_field( $field ) ) {
				continue;
			}

			$fields[] = array(
				'name'  => sanitize_key( $field['name'] ),
				'label' => sanitize_text_field( $field['label'] ?? $field['name'] ),
				'type'  => sanitize_key( $field['type'] ?? 'text' ),
			);
		}
	}

	return rest_ensure_response( array_values( array_unique( $fields, SORT_REGULAR ) ) );
}

/**
 * Returns public editorial post types available to the current user.
 *
 * @return WP_REST_Response
 */
function inblock_map_block_rest_get_post_types() {
	$types = get_post_types(
		array(
			'show_ui'            => true,
			'public'             => true,
			'publicly_queryable' => true,
		),
		'objects'
	);
	$output = array();

	foreach ( $types as $slug => $object ) {
		if ( 0 === strpos( $slug, 'wp_' ) || in_array( $slug, array( 'attachment', 'page', 'revision', 'nav_menu_item' ), true ) ) {
			continue;
		}

		if ( ! isset( $object->cap->edit_posts ) || ! current_user_can( $object->cap->edit_posts ) ) {
			continue;
		}

		$output[] = array(
			'slug'  => sanitize_key( $slug ),
			'label' => sanitize_text_field( $object->labels->name ?? $object->label ?? $slug ),
		);
	}

	usort(
		$output,
		static function ( $first, $second ) {
			return strcmp( $first['label'], $second['label'] );
		}
	);

	return rest_ensure_response( $output );
}

/**
 * Returns marker preview data for the editor.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response|WP_Error
 */
function inblock_map_block_rest_get_markers( $request ) {
	$mode = sanitize_key( (string) $request->get_param( 'mode' ) );
	$mode = in_array( $mode, array( 'single', 'collection' ), true ) ? $mode : 'single';

	$post_id                    = absint( $request->get_param( 'post_id' ) );
	$post_type                  = sanitize_key( (string) $request->get_param( 'post_type' ) );
	$source                     = sanitize_key( (string) $request->get_param( 'source' ) );
	$acf_field                  = sanitize_key( (string) $request->get_param( 'acf_field' ) );
	$repeater_field             = sanitize_key( (string) $request->get_param( 'repeater_field' ) );
	$repeater_coordinates_field = sanitize_key( (string) $request->get_param( 'repeater_coordinates_field' ) );
	$repeater_label_field       = sanitize_key( (string) $request->get_param( 'repeater_label_field' ) );
	$latitude_key               = sanitize_key( (string) $request->get_param( 'lat_meta_key' ) );
	$longitude_key              = sanitize_key( (string) $request->get_param( 'lng_meta_key' ) );
	$limit                      = max( 1, min( 500, absint( $request->get_param( 'limit' ) ) ) );
	$popup_fields               = json_decode( (string) $request->get_param( 'popup_fields' ), true );
	$popup_fields               = is_array( $popup_fields ) ? array_slice( $popup_fields, 0, 5 ) : array();

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
		$latitude_key,
		$longitude_key,
		$limit,
		$repeater_field,
		$repeater_coordinates_field,
		$repeater_label_field,
		$popup_fields
	);

	return rest_ensure_response( $markers );
}

/**
 * Registers editor REST API routes.
 */
function inblock_map_block_register_rest_routes() {
	$context_arguments = array(
		'post_id' => array(
			'type'              => 'integer',
			'sanitize_callback' => 'absint',
		),
		'post_type' => array(
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_key',
		),
	);

	register_rest_route(
		'inblock-map-block/v1',
		'/acf-repeater-fields',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => 'inblock_map_block_rest_can_edit_posts',
			'callback'            => 'inblock_map_block_rest_get_acf_repeater_fields',
			'args'                => $context_arguments,
		)
	);

	register_rest_route(
		'inblock-map-block/v1',
		'/acf-popup-fields',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => 'inblock_map_block_rest_can_edit_posts',
			'callback'            => 'inblock_map_block_rest_get_acf_popup_fields',
			'args'                => $context_arguments,
		)
	);

	register_rest_route(
		'inblock-map-block/v1',
		'/post-types',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => 'inblock_map_block_rest_can_edit_posts',
			'callback'            => 'inblock_map_block_rest_get_post_types',
		)
	);

	register_rest_route(
		'inblock-map-block/v1',
		'/markers',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => 'inblock_map_block_rest_can_edit_posts',
			'callback'            => 'inblock_map_block_rest_get_markers',
		)
	);
}
add_action( 'rest_api_init', 'inblock_map_block_register_rest_routes' );
