<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function inblock_map_block_register_rest_routes() {
	register_rest_route(
		'inblock-map-block/v1',
		'/post-types',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
			'callback'            => function () {
				$types = get_post_types( array( 'show_ui' => true ), 'objects' );

				$out = array();
				foreach ( $types as $slug => $obj ) {
					// Drop internal types.
					if ( str_starts_with( $slug, 'wp_' ) ) {
						continue;
					}
					if ( in_array( $slug, array( 'attachment', 'revision', 'nav_menu_item' ), true ) ) {
						continue;
					}

					$out[] = array(
						'slug'  => $slug,
						'label' => $obj->labels->singular_name ?? $obj->label ?? $slug,
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
}
add_action( 'rest_api_init', 'inblock_map_block_register_rest_routes' );
