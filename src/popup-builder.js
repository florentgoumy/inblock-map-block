( function ( wp ) {
	'use strict';
	if (
		! wp ||
		! wp.hooks ||
		! wp.compose ||
		! wp.element ||
		! wp.components ||
		! wp.blockEditor ||
		! wp.apiFetch
	) {
		return;
	}
	const el = wp.element.createElement;
	const Fragment = wp.element.Fragment;
	const useEffect = wp.element.useEffect;
	const useState = wp.element.useState;
	const PanelBody = wp.components.PanelBody;
	const SelectControl = wp.components.SelectControl;
	const RadioControl = wp.components.RadioControl;
	const TextControl = wp.components.TextControl;
	const ToggleControl = wp.components.ToggleControl;
	const Button = wp.components.Button;
	const InspectorControls = wp.blockEditor.InspectorControls;
	const __ = wp.i18n.__;

	wp.hooks.addFilter(
		'editor.BlockEdit',
		'inblock-map-block/popup-builder',
		wp.compose.createHigherOrderComponent( function ( BlockEdit ) {
			return function ( props ) {
				const isMap = props.name === 'inblock/map-block';
				const attrs = props.attributes || {};
				const fields = Array.isArray( attrs.markerPopupFields )
					? attrs.markerPopupFields.slice( 0, 5 )
					: [];
				const state = useState( [] );
				const available = state[ 0 ];
				const setAvailable = state[ 1 ];
				const mode =
					attrs.markersMode ||
					( attrs.markersPostType ? 'collection' : 'single' );
				const nativeOptions = [
					{
						label: __( 'Excerpt', 'inblock-map-block' ),
						value: 'excerpt',
					},
					{
						label: __( 'Featured image', 'inblock-map-block' ),
						value: 'featured_image',
					},
					{
						label: __( 'Author', 'inblock-map-block' ),
						value: 'author',
					},
					{
						label: __( 'Published date', 'inblock-map-block' ),
						value: 'published_date',
					},
					{
						label: __( 'Content type', 'inblock-map-block' ),
						value: 'post_type',
					},
					{
						label: __(
							'Categories and terms',
							'inblock-map-block'
						),
						value: 'taxonomies',
					},
				];
				const postId = Number.parseInt(
					( props.context && props.context.postId ) ||
						( wp.data &&
							wp.data
								.select( 'core/editor' )
								.getCurrentPostId() ) ||
						0,
					10
				);

				useEffect(
					function () {
						if (
							! isMap ||
							! attrs.markersEnabled ||
							! attrs.markersPopup
						) {
							setAvailable( [] );
							return;
						}
						const query = new URLSearchParams( {
							post_id: String( postId || 0 ),
							post_type:
								mode === 'collection'
									? attrs.markersPostType || ''
									: '',
						} );
						wp.apiFetch( {
							path:
								'/inblock-map-block/v1/acf-popup-fields?' +
								query.toString(),
						} )
							.then( function ( result ) {
								setAvailable(
									Array.isArray( result ) ? result : []
								);
							} )
							.catch( function () {
								setAvailable( [] );
							} );
					},
					[
						isMap,
						attrs.markersEnabled,
						attrs.markersPopup,
						attrs.markersPostType,
						mode,
						postId,
						setAvailable,
					]
				);

				function save( next ) {
					props.setAttributes( {
						markerPopupFields: next.slice( 0, 5 ),
					} );
				}
				function update( index, values ) {
					const next = fields.slice();
					next[ index ] = Object.assign( {}, next[ index ], values );
					save( next );
				}
				function move( index, delta ) {
					const next = fields.slice();
					const target = index + delta;
					const item = next[ index ];
					next[ index ] = next[ target ];
					next[ target ] = item;
					save( next );
				}

				const inspector =
					isMap && attrs.markersEnabled && attrs.markersPopup
						? el(
								InspectorControls,
								{},
								el(
									PanelBody,
									{
										title: __(
											'Popup content',
											'inblock-map-block'
										),
										initialOpen: false,
									},
									el( ToggleControl, {
										label: __(
											'Show title',
											'inblock-map-block'
										),
										checked:
											attrs.markerPopupShowTitle !==
											false,
										onChange( value ) {
											props.setAttributes( {
												markerPopupShowTitle: !! value,
											} );
										},
									} ),
									el( ToggleControl, {
										label: __(
											'Show details link',
											'inblock-map-block'
										),
										checked:
											attrs.markerPopupShowLink !== false,
										onChange( value ) {
											props.setAttributes( {
												markerPopupShowLink: !! value,
											} );
										},
									} ),
									attrs.markerPopupShowLink !== false
										? el(
												Fragment,
												{},
												el( TextControl, {
													label: __(
														'Details link label',
														'inblock-map-block'
													),
													value:
														attrs.markerDetailsLinkLabel ||
														'',
													placeholder: __(
														'Plus d’infos',
														'inblock-map-block'
													),
													onChange( value ) {
														props.setAttributes( {
															markerDetailsLinkLabel:
																value,
														} );
													},
												} ),
												el( RadioControl, {
													label: __(
														'Link presentation',
														'inblock-map-block'
													),
													selected:
														attrs.markerPopupLinkStyle ||
														'link',
													options: [
														{
															label: __(
																'Text link',
																'inblock-map-block'
															),
															value: 'link',
														},
														{
															label: __(
																'Button',
																'inblock-map-block'
															),
															value: 'button',
														},
													],
													onChange( value ) {
														props.setAttributes( {
															markerPopupLinkStyle:
																value,
														} );
													},
												} )
										  )
										: null,
									el( 'hr', {} ),
									el(
										'p',
										{
											className:
												'components-base-control__help',
										},
										__(
											'Add up to 5 WordPress or ACF fields. Empty values are hidden automatically.',
											'inblock-map-block'
										)
									),
									fields.map( function ( field, index ) {
										const source = field.source || 'acf';
										const options = available.filter(
											function ( candidate ) {
												return (
													candidate.name ===
														field.name ||
													! fields.some(
														function ( selected ) {
															return (
																( selected.source ||
																	'acf' ) ===
																	'acf' &&
																selected.name ===
																	candidate.name
															);
														}
													)
												);
											}
										);
										const filteredNativeOptions =
											nativeOptions.filter(
												function ( candidate ) {
													return (
														candidate.value ===
															field.key ||
														! fields.some(
															function (
																selected
															) {
																return (
																	selected.source ===
																		'wordpress' &&
																	selected.key ===
																		candidate.value
																);
															}
														)
													);
												}
											);
										return el(
											'div',
											{
												key: field.name + index,
												style: {
													border: '1px solid #ddd',
													padding: '10px',
													marginBottom: '10px',
												},
											},
											el( SelectControl, {
												label: __(
													'Field source',
													'inblock-map-block'
												),
												value: source,
												options: [
													{
														label: 'WordPress',
														value: 'wordpress',
													},
													{
														label: 'ACF',
														value: 'acf',
													},
												],
												onChange( value ) {
													update(
														index,
														value === 'wordpress'
															? {
																	source: value,
																	key: 'excerpt',
																	name: '',
																	label: __(
																		'Excerpt',
																		'inblock-map-block'
																	),
																	showLabel: false,
															  }
															: {
																	source: value,
																	key: '',
																	name: available[ 0 ]
																		? available[ 0 ]
																				.name
																		: '',
																	label: available[ 0 ]
																		? available[ 0 ]
																				.label
																		: '',
																	showLabel: false,
															  }
													);
												},
											} ),
											source === 'wordpress'
												? el( SelectControl, {
														label: __(
															'WordPress field',
															'inblock-map-block'
														),
														value:
															field.key ||
															'excerpt',
														options:
															filteredNativeOptions,
														onChange( key ) {
															const selected =
																nativeOptions.find(
																	function (
																		item
																	) {
																		return (
																			item.value ===
																			key
																		);
																	}
																);
															update( index, {
																key,
																label: selected
																	? selected.label
																	: '',
															} );
														},
												  } )
												: el( SelectControl, {
														label: __(
															'ACF field',
															'inblock-map-block'
														),
														value: field.name || '',
														options: [
															{
																label: '—',
																value: '',
															},
														].concat(
															options.map(
																function (
																	item
																) {
																	return {
																		label:
																			item.label +
																			' (' +
																			item.name +
																			')',
																		value: item.name,
																	};
																}
															)
														),
														onChange( name ) {
															const selected =
																available.find(
																	function (
																		item
																	) {
																		return (
																			item.name ===
																			name
																		);
																	}
																);
															update( index, {
																name,
																label: selected
																	? selected.label
																	: '',
															} );
														},
												  } ),
											el( ToggleControl, {
												label: __(
													'Show label',
													'inblock-map-block'
												),
												checked:
													field.showLabel === true,
												onChange( showLabel ) {
													update( index, {
														showLabel,
													} );
												},
											} ),
											field.showLabel === true
												? el( TextControl, {
														label: __(
															'Custom label',
															'inblock-map-block'
														),
														value:
															field.label || '',
														onChange( label ) {
															update( index, {
																label,
															} );
														},
												  } )
												: null,
											el(
												'div',
												{
													style: {
														display: 'flex',
														gap: '6px',
													},
												},
												el(
													Button,
													{
														variant: 'secondary',
														size: 'small',
														disabled: index === 0,
														onClick() {
															move( index, -1 );
														},
													},
													__(
														'Up',
														'inblock-map-block'
													)
												),
												el(
													Button,
													{
														variant: 'secondary',
														size: 'small',
														disabled:
															index ===
															fields.length - 1,
														onClick() {
															move( index, 1 );
														},
													},
													__(
														'Down',
														'inblock-map-block'
													)
												),
												el(
													Button,
													{
														variant: 'tertiary',
														size: 'small',
														isDestructive: true,
														onClick() {
															save(
																fields.filter(
																	function (
																		item,
																		itemIndex
																	) {
																		return (
																			itemIndex !==
																			index
																		);
																	}
																)
															);
														},
													},
													__(
														'Remove',
														'inblock-map-block'
													)
												)
											)
										);
									} ),
									el(
										Button,
										{
											variant: 'secondary',
											disabled: fields.length >= 5,
											onClick() {
												const firstNative =
													nativeOptions.find(
														function ( item ) {
															return ! fields.some(
																function (
																	selected
																) {
																	return (
																		selected.source ===
																			'wordpress' &&
																		selected.key ===
																			item.value
																	);
																}
															);
														}
													);
												const firstAcf = available.find(
													function ( item ) {
														return ! fields.some(
															function (
																selected
															) {
																return (
																	( selected.source ||
																		'acf' ) ===
																		'acf' &&
																	selected.name ===
																		item.name
																);
															}
														);
													}
												);
												if ( firstNative ) {
													save(
														fields.concat( [
															{
																source: 'wordpress',
																key: firstNative.value,
																label: firstNative.label,
																showLabel: false,
															},
														] )
													);
												} else if ( firstAcf ) {
													save(
														fields.concat( [
															{
																source: 'acf',
																name: firstAcf.name,
																label: firstAcf.label,
																showLabel: false,
															},
														] )
													);
												}
											},
										},
										__( 'Add field', 'inblock-map-block' )
									),
									fields.length >= 5
										? el(
												'p',
												{
													className:
														'components-base-control__help',
												},
												__(
													'Maximum of 5 fields reached.',
													'inblock-map-block'
												)
										  )
										: null
								)
						  )
						: null;
				return el( Fragment, {}, el( BlockEdit, props ), inspector );
			};
		}, 'withInblockPopupBuilder' )
	);
} )( window.wp );
