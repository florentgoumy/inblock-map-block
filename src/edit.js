import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	useSetting,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RadioControl,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
	Tooltip,
	Icon,
	ColorPalette,
} from '@wordpress/components';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import L from 'leaflet';
import 'leaflet.markercluster';
import '@maplibre/maplibre-gl-leaflet';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import './leaflet-icons';
import {
	BASE_MAP_DESCRIPTIONS,
	configureMapLibreWorker,
	createBaseLayer,
	getTileConfig,
} from './tile';

configureMapLibreWorker( maplibregl );

async function fetchPostTypes() {
	const data = await apiFetch( { path: '/inblock-map-block/v1/post-types' } );
	if ( ! Array.isArray( data ) ) {
		return [];
	}

	return data
		.map( ( t ) => ( {
			label: t.label,
			value: t.slug,
		} ) )
		.sort( ( a, b ) => a.label.localeCompare( b.label ) );
}

function escapeHtml( str ) {
	return String( str )
		.replaceAll( '&', '&amp;' )
		.replaceAll( '<', '&lt;' )
		.replaceAll( '>', '&gt;' )
		.replaceAll( '"', '&quot;' )
		.replaceAll( "'", '&#039;' );
}

function mixHex( first, second, amount ) {
	const parse = ( value ) => {
		const hex = String( value || '' ).replace( '#', '' );
		const normalized =
			hex.length === 3
				? hex
						.split( '' )
						.map( ( part ) => part + part )
						.join( '' )
				: hex;
		if ( ! /^[0-9a-f]{6}$/i.test( normalized ) ) {
			return null;
		}
		return [ 0, 2, 4 ].map( ( index ) =>
			Number.parseInt( normalized.slice( index, index + 2 ), 16 )
		);
	};
	const a = parse( first );
	const b = parse( second );
	if ( ! a || ! b ) {
		return first;
	}
	return (
		'#' +
		a
			.map( ( channel, index ) =>
				Math.round( channel * ( 1 - amount ) + b[ index ] * amount )
					.toString( 16 )
					.padStart( 2, '0' )
			)
			.join( '' )
	);
}

function getThemeMapColors( palette ) {
	const usable = palette.filter( ( item ) =>
		/^#[0-9a-f]{3,6}$/i.test( item?.color || '' )
	);
	const namedAccent = usable.find( ( item ) =>
		/primary|accent/i.test( `${ item.slug || '' } ${ item.name || '' }` )
	);
	const accent =
		namedAccent?.color ||
		usable.find(
			( item ) =>
				! [ '#000', '#000000', '#fff', '#ffffff' ].includes(
					item.color.toLowerCase()
				)
		)?.color ||
		'#2563eb';
	const contrast =
		usable.find( ( item ) =>
			/contrast|foreground|text/i.test(
				`${ item.slug || '' } ${ item.name || '' }`
			)
		)?.color || '#243044';
	const background = mixHex( '#ffffff', accent, 0.07 );
	return {
		background,
		water: mixHex( '#77b5e8', accent, 0.18 ),
		nature: mixHex( '#9bc48a', accent, 0.18 ),
		roads: mixHex( '#ffffff', accent, 0.1 ),
		buildings: mixHex( '#d8dde3', accent, 0.12 ),
		labels: contrast,
		labelHalo: background,
	};
}

const MAP_COLOR_PRESETS = {
	pastel: {
		background: '#f7f3ee',
		water: '#b9dce8',
		nature: '#c9dfc1',
		roads: '#fffaf4',
		buildings: '#ddd3cb',
		labels: '#4b5563',
		labelHalo: '#fffaf4',
	},
	monochrome: {
		background: '#f3f4f6',
		water: '#d1d5db',
		nature: '#e5e7eb',
		roads: '#ffffff',
		buildings: '#c7cbd1',
		labels: '#252a32',
		labelHalo: '#ffffff',
	},
	nature: {
		background: '#f2f0df',
		water: '#9dc9cf',
		nature: '#9fbd82',
		roads: '#fff9e8',
		buildings: '#d8cdb4',
		labels: '#31443a',
		labelHalo: '#f7f4e8',
	},
	high_contrast: {
		background: '#ffffff',
		water: '#65b5e8',
		nature: '#9fcf72',
		roads: '#ffffff',
		buildings: '#aeb6c2',
		labels: '#111827',
		labelHalo: '#ffffff',
	},
};

function popupFieldsHtml( fields ) {
	if ( ! Array.isArray( fields ) ) {
		return '';
	}
	return fields
		.slice( 0, 5 )
		.map( ( field ) => {
			const label =
				field?.show_label && field?.label
					? '<span class="inblock-map-block__popup-label">' +
					  escapeHtml( field.label ) +
					  ' : </span>'
					: '';
			if ( field?.type === 'image' && field?.value?.url ) {
				return (
					'<div class="inblock-map-block__popup-field inblock-map-block__popup-image">' +
					label +
					'<img src="' +
					escapeHtml( field.value.url ) +
					'" alt="' +
					escapeHtml( field.value.alt || '' ) +
					'"></div>'
				);
			}
			const value =
				field?.value === undefined || field?.value === null
					? ''
					: escapeHtml( field.value );
			return value
				? '<div class="inblock-map-block__popup-field">' +
						label +
						'<span>' +
						value +
						'</span></div>'
				: '';
		} )
		.join( '' );
}

function MarkersSourceHelp() {
	const content = (
		<div>
			<div>
				<strong>ACF Location</strong>: field returning an object with{ ' ' }
				<code>lat</code>/<code>lng</code>.
			</div>
			<div>
				<strong>ACF text</strong>: text field with <code>lat,lng</code>{ ' ' }
				or <code>\u007Blat,lng\u007D</code>.
			</div>
			<div>
				<strong>ACF Repeater</strong>: one marker per row using a
				coordinates sub-field.
			</div>
			<div>
				<strong>Post meta</strong>: meta keys (default{ ' ' }
				<code>inblock_lat</code>/<code>inblock_lng</code>).
			</div>
		</div>
	);

	return (
		<Tooltip text={ content }>
			<span style={ { display: 'inline-flex', marginLeft: 6 } }>
				<Icon icon="info" />
			</span>
		</Tooltip>
	);
}

export default function Edit( { attributes, setAttributes, context } ) {
	const {
		lat,
		lng,
		zoom,
		height,
		baseMap,
		customBaseMapEnabled,
		customBaseMapType = 'xyz',
		customBaseMapUrl,
		customMapLibreStyleUrl,
		customBaseMapAttribution,
		baseMapColorMode = 'original',
		baseMapColors,
		markersEnabled,
		markersMode,
		markersPostType,
		markersSource,
		acfLocationField,
		acfRepeaterField,
		acfRepeaterCoordinatesField,
		acfRepeaterLabelField,
		latMetaKey,
		lngMetaKey,
		markersLimit,
		markersPopup,
		markersAutoFit,
		markerStyle,
		markerDetailsLinkLabel,
		markerPopupShowTitle = true,
		markerPopupShowLink = true,
		markerPopupLinkStyle = 'link',
		markerPopupFields = [],
		markerColor,
		markersCluster,
		markersClusterDisableAtZoom,
		customMarkerEnabled,
		customMarkerUrl,
		customMarkerWidth,
		customMarkerHeight,
		showStartPosition,
	} = attributes;

	const themeColors = useSetting( 'color.palette' );
	const allowCustomColors = useSetting( 'color.custom' );
	const colors = useMemo( () => themeColors || [], [ themeColors ] );
	const mapColors = useMemo( () => baseMapColors || {}, [ baseMapColors ] );
	const effectiveMarkersMode =
		markersMode || ( markersPostType ? 'collection' : 'single' );
	const currentPostId = Number.parseInt(
		context?.postId ||
			window.wp?.data?.select( 'core/editor' )?.getCurrentPostId?.() ||
			'0',
		10
	);

	const [ postTypeOptions, setPostTypeOptions ] = useState( [] );
	const [ previewMarkers, setPreviewMarkers ] = useState( [] );
	const [ acfRepeaterOptions, setAcfRepeaterOptions ] = useState( [] );
	const [ baseMapStatus, setBaseMapStatus ] = useState( 'idle' );

	const wrapperRef = useRef( null );
	const mapElRef = useRef( null );
	const mapRef = useRef( null );
	const tileLayerRef = useRef( null );
	const markersLayerRef = useRef( null );
	const lastAutoFitKeyRef = useRef( '' );
	const viewportAttributesRef = useRef( { lat, lng, zoom } );

	useEffect( () => {
		let cancelled = false;
		fetchPostTypes()
			.then( ( types ) => {
				if ( cancelled ) {
					return;
				}
				setPostTypeOptions( types );
			} )
			.catch( () => {} );
		return () => {
			cancelled = true;
		};
	}, [] );

	useEffect( () => {
		if ( ! markersEnabled || markersSource !== 'acf_repeater' ) {
			setAcfRepeaterOptions( [] );
			return;
		}
		const query = new URLSearchParams( {
			post_id: String( currentPostId || 0 ),
			post_type:
				effectiveMarkersMode === 'collection'
					? markersPostType || ''
					: '',
		} );
		apiFetch( {
			path: `/inblock-map-block/v1/acf-repeater-fields?${ query.toString() }`,
		} )
			.then( ( fields ) =>
				setAcfRepeaterOptions( Array.isArray( fields ) ? fields : [] )
			)
			.catch( () => setAcfRepeaterOptions( [] ) );
	}, [
		markersEnabled,
		markersSource,
		currentPostId,
		effectiveMarkersMode,
		markersPostType,
	] );

	const selectedRepeater = acfRepeaterOptions.find(
		( field ) => field.name === acfRepeaterField
	);
	const repeaterSubFields = selectedRepeater?.subFields || [];

	useEffect( () => {
		let cancelled = false;

		if (
			! markersEnabled ||
			( effectiveMarkersMode === 'single' && ! currentPostId ) ||
			( effectiveMarkersMode === 'collection' && ! markersPostType )
		) {
			setPreviewMarkers( [] );
			return () => {
				cancelled = true;
			};
		}

		const query = new URLSearchParams( {
			mode: effectiveMarkersMode,
			post_id: String( currentPostId || 0 ),
			post_type: markersPostType || '',
			source: markersSource,
			acf_field: acfLocationField,
			repeater_field: acfRepeaterField || '',
			repeater_coordinates_field: acfRepeaterCoordinatesField || '',
			repeater_label_field: acfRepeaterLabelField || '',
			lat_meta_key: latMetaKey,
			lng_meta_key: lngMetaKey,
			limit: String( markersLimit ),
			popup_fields: JSON.stringify( markerPopupFields.slice( 0, 5 ) ),
		} );

		apiFetch( {
			path: `/inblock-map-block/v1/markers?${ query.toString() }`,
		} )
			.then( ( markers ) => {
				if ( ! cancelled ) {
					setPreviewMarkers(
						Array.isArray( markers ) ? markers : []
					);
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setPreviewMarkers( [] );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [
		markersEnabled,
		effectiveMarkersMode,
		currentPostId,
		markersPostType,
		markersSource,
		acfLocationField,
		acfRepeaterField,
		acfRepeaterCoordinatesField,
		acfRepeaterLabelField,
		latMetaKey,
		lngMetaKey,
		markersLimit,
		markerPopupFields,
	] );

	useEffect( () => {
		if ( ! mapElRef.current || mapRef.current ) {
			return;
		}

		const map = L.map( mapElRef.current, {
			zoomControl: true,
			attributionControl: true,
		} ).setView( [ lat, lng ], zoom );

		const tile = getTileConfig( baseMap, {
			enabled: !! customBaseMapEnabled,
			type: customBaseMapType,
			url: customBaseMapUrl,
			styleUrl: customMapLibreStyleUrl,
			attribution: customBaseMapAttribution,
		} );
		const layer = createBaseLayer( L, tile, {
			colors: baseMapColorMode === 'original' ? {} : mapColors,
			onLoading: () => setBaseMapStatus( 'loading' ),
			onLoad: () => setBaseMapStatus( 'loaded' ),
			onError: () => setBaseMapStatus( 'error' ),
		} ).addTo( map );

		mapRef.current = map;
		tileLayerRef.current = layer;
		markersLayerRef.current = null;

		map.on( 'moveend', () => {
			const center = map.getCenter();
			const nextLat = Number.parseFloat( center.lat.toFixed( 6 ) );
			const nextLng = Number.parseFloat( center.lng.toFixed( 6 ) );
			const nextZoom = map.getZoom();
			const current = viewportAttributesRef.current;
			if (
				nextLat !== current.lat ||
				nextLng !== current.lng ||
				nextZoom !== current.zoom
			) {
				viewportAttributesRef.current = {
					lat: nextLat,
					lng: nextLng,
					zoom: nextZoom,
				};
				setAttributes( {
					lat: nextLat,
					lng: nextLng,
					zoom: nextZoom,
				} );
			}
		} );

		// Gutenberg can render the block canvas in a different document from
		// the one Leaflet uses for its global mouseup/touchend listeners. When
		// that happens, Leaflet never receives the release event and keeps the
		// map attached to the pointer. Relay release events from both documents
		// and their windows to the active Leaflet draggable.
		const editorDocument = mapElRef.current.ownerDocument;
		const editorWindow = editorDocument.defaultView;
		const releaseTargets = new Set(
			[ editorDocument, editorWindow ].filter(
				( target ) => target && target !== document && target !== window
			)
		);
		const releaseEvents = [
			'mouseup',
			'pointerup',
			'pointercancel',
			'touchend',
			'touchcancel',
		];
		const finishMapDrag = () => {
			const draggable = map.dragging?._draggable;
			if ( draggable && L.Draggable._dragging === draggable ) {
				draggable.finishDrag();
			}
		};

		releaseTargets.forEach( ( target ) => {
			releaseEvents.forEach( ( eventName ) => {
				target.addEventListener( eventName, finishMapDrag, true );
			} );
			target.addEventListener( 'blur', finishMapDrag, true );
		} );

		setTimeout( () => map.invalidateSize(), 0 );

		return () => {
			finishMapDrag();
			releaseTargets.forEach( ( target ) => {
				releaseEvents.forEach( ( eventName ) => {
					target.removeEventListener(
						eventName,
						finishMapDrag,
						true
					);
				} );
				target.removeEventListener( 'blur', finishMapDrag, true );
			} );
			map.remove();
			mapRef.current = null;
			tileLayerRef.current = null;
			markersLayerRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		viewportAttributesRef.current = { lat, lng, zoom };
		if ( ! mapRef.current ) {
			return;
		}
		const center = mapRef.current.getCenter();
		const currentLat = Number.parseFloat( center.lat.toFixed( 6 ) );
		const currentLng = Number.parseFloat( center.lng.toFixed( 6 ) );
		if (
			currentLat !== lat ||
			currentLng !== lng ||
			mapRef.current.getZoom() !== zoom
		) {
			mapRef.current.setView( [ lat, lng ], zoom, { animate: false } );
		}
	}, [ lat, lng, zoom ] );

	useEffect( () => {
		if ( ! mapRef.current ) {
			return;
		}
		setTimeout( () => mapRef.current.invalidateSize(), 0 );
	}, [ height ] );

	useEffect( () => {
		if ( ! mapRef.current || ! tileLayerRef.current ) {
			return;
		}
		// Replace tile layer.
		tileLayerRef.current.remove();
		const tile = getTileConfig( baseMap, {
			enabled: !! customBaseMapEnabled,
			type: customBaseMapType,
			url: customBaseMapUrl,
			styleUrl: customMapLibreStyleUrl,
			attribution: customBaseMapAttribution,
		} );
		tileLayerRef.current = createBaseLayer( L, tile, {
			colors: baseMapColorMode === 'original' ? {} : mapColors,
			onLoading: () => setBaseMapStatus( 'loading' ),
			onLoad: () => setBaseMapStatus( 'loaded' ),
			onError: () => setBaseMapStatus( 'error' ),
		} ).addTo( mapRef.current );
	}, [
		baseMap,
		customBaseMapEnabled,
		customBaseMapType,
		customBaseMapUrl,
		customMapLibreStyleUrl,
		customBaseMapAttribution,
		baseMapColorMode,
		mapColors,
	] );

	useEffect( () => {
		if ( ! mapRef.current ) {
			return;
		}
		try {
			if ( markersLayerRef.current ) {
				markersLayerRef.current.clearLayers();
				markersLayerRef.current.remove();
			}
			markersLayerRef.current = markersCluster
				? L.markerClusterGroup( {
						disableClusteringAtZoom: markersClusterDisableAtZoom,
				  } )
				: L.layerGroup();
			markersLayerRef.current.addTo( mapRef.current );

			if ( ! markersEnabled ) {
				lastAutoFitKeyRef.current = '';
				return;
			}

			const bounds = [];

			previewMarkers.forEach( ( m ) => {
				if (
					! Number.isFinite( m?.lat ) ||
					! Number.isFinite( m?.lng )
				) {
					return;
				}

				bounds.push( [ m.lat, m.lng ] );

				let previewMarker;
				if ( markerStyle === 'circle' ) {
					previewMarker = L.circleMarker( [ m.lat, m.lng ], {
						radius: 8,
						color: markerColor,
						fillColor: markerColor,
						fillOpacity: 0.9,
						weight: 2,
					} ).addTo( markersLayerRef.current );
				} else if ( markerStyle === 'dot' ) {
					previewMarker = L.circleMarker( [ m.lat, m.lng ], {
						radius: 5,
						color: markerColor,
						fillColor: markerColor,
						fillOpacity: 0.9,
						weight: 2,
					} ).addTo( markersLayerRef.current );
				} else if ( customMarkerEnabled && customMarkerUrl ) {
					previewMarker = L.marker( [ m.lat, m.lng ], {
						icon: L.icon( {
							iconUrl: customMarkerUrl,
							iconSize: [ customMarkerWidth, customMarkerHeight ],
							iconAnchor: [
								Math.round( customMarkerWidth / 2 ),
								customMarkerHeight,
							],
						} ),
					} ).addTo( markersLayerRef.current );
				} else {
					previewMarker = L.marker( [ m.lat, m.lng ] ).addTo(
						markersLayerRef.current
					);
				}

				if ( markersPopup && previewMarker ) {
					const title = escapeHtml( m.title || '' );
					const url = escapeHtml( m.url || '' );
					const linkLabel = escapeHtml(
						markerDetailsLinkLabel?.trim() || 'Plus d’infos'
					);
					const locationLabel = escapeHtml( m.locationLabel || '' );
					previewMarker.bindPopup(
						'<div class="inblock-map-block__popup">' +
							( markerPopupShowTitle && title
								? '<strong>' + title + '</strong>'
								: '' ) +
							( locationLabel
								? '<div class="inblock-map-block__popup-location">' +
								  locationLabel +
								  '</div>'
								: '' ) +
							popupFieldsHtml( m.popupFields ) +
							( markerPopupShowLink && url
								? '<div><a href="' +
								  url +
								  ( markerPopupLinkStyle === 'button'
										? '" class="inblock-map-block__popup-button'
										: '' ) +
								  '">' +
								  linkLabel +
								  '</a></div>'
								: '' ) +
							'</div>'
					);
				}
			} );

			if ( markersAutoFit && bounds.length >= 1 ) {
				const autoFitKey = previewMarkers
					.filter(
						( marker ) =>
							Number.isFinite( marker?.lat ) &&
							Number.isFinite( marker?.lng )
					)
					.map(
						( marker ) =>
							`${ marker.markerId || marker.id || '' }:${
								marker.lat
							},${ marker.lng }:${ marker.locationLabel || '' }`
					)
					.join( '|' );
				if ( lastAutoFitKeyRef.current !== autoFitKey ) {
					lastAutoFitKeyRef.current = autoFitKey;
					if ( bounds.length === 1 ) {
						mapRef.current.setView(
							bounds[ 0 ],
							mapRef.current.getZoom(),
							{
								animate: false,
							}
						);
					} else {
						mapRef.current.fitBounds( bounds, {
							padding: [ 20, 20 ],
						} );
					}
				}
			} else {
				lastAutoFitKeyRef.current = '';
			}
		} catch ( error ) {
			// A malformed ACF row must never make the whole Gutenberg block crash.
			window.console?.warn?.(
				'MapBlock marker preview skipped invalid data.',
				error
			);
		}
	}, [
		markersEnabled,
		markerStyle,
		markerColor,
		markersAutoFit,
		markersCluster,
		markersClusterDisableAtZoom,
		markersPopup,
		markerDetailsLinkLabel,
		markerPopupShowTitle,
		markerPopupShowLink,
		markerPopupLinkStyle,
		customMarkerEnabled,
		customMarkerUrl,
		customMarkerWidth,
		customMarkerHeight,
		previewMarkers,
	] );

	const blockProps = useBlockProps( { ref: wrapperRef } );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Map settings', 'inblock-map-block' ) }
					initialOpen
				>
					<SelectControl
						label={ __( 'Base map', 'inblock-map-block' ) }
						value={ baseMap }
						options={ [
							{ label: 'OpenStreetMap', value: 'osm' },
							{
								label: 'OpenFreeMap — Liberty',
								value: 'openfreemap_liberty',
							},
							{
								label: 'OpenFreeMap — Positron',
								value: 'openfreemap_positron',
							},
							{
								label: 'OpenFreeMap — Bright',
								value: 'openfreemap_bright',
							},
							{
								label: 'OpenFreeMap — Dark',
								value: 'openfreemap_dark',
							},
							{
								label: 'OpenFreeMap — Fiord',
								value: 'openfreemap_fiord',
							},
							{
								label: 'OpenFreeMap — 3D (experimental)',
								value: 'openfreemap_3d',
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { baseMap: value } )
						}
						help={
							BASE_MAP_DESCRIPTIONS[ baseMap ] ||
							__(
								'OpenFreeMap vector styles require no account or API key.',
								'inblock-map-block'
							)
						}
					/>

					{ baseMap.startsWith( 'openfreemap_' ) &&
						! customBaseMapEnabled && (
							<>
								<SelectControl
									label={ __(
										'Map colors',
										'inblock-map-block'
									) }
									value={ baseMapColorMode }
									options={ [
										{
											label: __(
												'Original style',
												'inblock-map-block'
											),
											value: 'original',
										},
										{
											label: __(
												'Theme palette',
												'inblock-map-block'
											),
											value: 'theme',
										},
										{
											label: __(
												'MapBlock — Pastel',
												'inblock-map-block'
											),
											value: 'pastel',
										},
										{
											label: __(
												'MapBlock — Monochrome',
												'inblock-map-block'
											),
											value: 'monochrome',
										},
										{
											label: __(
												'MapBlock — Nature',
												'inblock-map-block'
											),
											value: 'nature',
										},
										{
											label: __(
												'MapBlock — High contrast',
												'inblock-map-block'
											),
											value: 'high_contrast',
										},
										{
											label: __(
												'Custom',
												'inblock-map-block'
											),
											value: 'custom',
										},
									] }
									onChange={ ( mode ) => {
										const next = { baseMapColorMode: mode };
										if (
											mode === 'theme' &&
											colors.length
										) {
											next.baseMapColors =
												getThemeMapColors( colors );
										} else if (
											MAP_COLOR_PRESETS[ mode ]
										) {
											next.baseMapColors =
												MAP_COLOR_PRESETS[ mode ];
										}
										setAttributes( next );
									} }
									help={
										baseMapColorMode === 'theme' &&
										! colors.length
											? __(
													'No theme palette is available.',
													'inblock-map-block'
											  )
											: undefined
									}
								/>

								{ baseMapColorMode === 'custom' &&
									[
										[
											'background',
											__(
												'Background',
												'inblock-map-block'
											),
										],
										[
											'water',
											__( 'Water', 'inblock-map-block' ),
										],
										[
											'nature',
											__(
												'Natural areas',
												'inblock-map-block'
											),
										],
										[
											'roads',
											__(
												'Main roads',
												'inblock-map-block'
											),
										],
										[
											'buildings',
											__(
												'Buildings',
												'inblock-map-block'
											),
										],
										[
											'labels',
											__( 'Labels', 'inblock-map-block' ),
										],
									].map( ( [ key, label ] ) => (
										<div
											key={ key }
											className="inblock-map-block__color-setting"
										>
											<strong>{ label }</strong>
											<ColorPalette
												colors={ colors }
												disableCustomColors={
													! allowCustomColors
												}
												value={ mapColors[ key ] }
												onChange={ ( value ) =>
													setAttributes( {
														baseMapColors: {
															...mapColors,
															[ key ]: value,
														},
													} )
												}
											/>
										</div>
									) ) }
							</>
						) }

					<ToggleControl
						label={ __(
							'Use a custom map source',
							'inblock-map-block'
						) }
						checked={ !! customBaseMapEnabled }
						onChange={ ( value ) =>
							setAttributes( { customBaseMapEnabled: !! value } )
						}
					/>

					{ customBaseMapEnabled && (
						<>
							<SelectControl
								label={ __(
									'Custom source type',
									'inblock-map-block'
								) }
								value={ customBaseMapType }
								options={ [
									{
										label: __(
											'XYZ raster tiles',
											'inblock-map-block'
										),
										value: 'xyz',
									},
									{
										label: __(
											'MapLibre style (JSON URL)',
											'inblock-map-block'
										),
										value: 'maplibre',
									},
								] }
								onChange={ ( value ) =>
									setAttributes( {
										customBaseMapType: value,
									} )
								}
							/>
							{ customBaseMapType === 'maplibre' ? (
								<TextControl
									label={ __(
										'MapLibre style JSON URL',
										'inblock-map-block'
									) }
									value={ customMapLibreStyleUrl || '' }
									placeholder="https://example.com/style.json"
									type="url"
									onChange={ ( value ) =>
										setAttributes( {
											customMapLibreStyleUrl: value,
										} )
									}
									help={ __(
										'The style and all its fonts, sprites and data sources must allow browser access (CORS).',
										'inblock-map-block'
									) }
								/>
							) : (
								<>
									<TextControl
										label={ __(
											'XYZ tile URL',
											'inblock-map-block'
										) }
										value={ customBaseMapUrl || '' }
										placeholder="https://example.com/{z}/{x}/{y}.png"
										onChange={ ( value ) =>
											setAttributes( {
												customBaseMapUrl: value,
											} )
										}
									/>
									<TextControl
										label={ __(
											'Tile attribution',
											'inblock-map-block'
										) }
										value={ customBaseMapAttribution || '' }
										onChange={ ( value ) =>
											setAttributes( {
												customBaseMapAttribution: value,
											} )
										}
										help={ __(
											'Required by most tile providers.',
											'inblock-map-block'
										) }
									/>
								</>
							) }
						</>
					) }

					{ baseMapStatus === 'loading' && (
						<p className="inblock-map-block__map-status">
							{ __( 'Loading map…', 'inblock-map-block' ) }
						</p>
					) }
					{ baseMapStatus === 'error' && (
						<p className="inblock-map-block__map-status is-error">
							{ __(
								'The map provider could not be loaded. Check your connection or choose another base map.',
								'inblock-map-block'
							) }
						</p>
					) }

					<p>
						{ __(
							'Déplacez la carte et zoomez pour définir la vue par défaut.',
							'inblock-map-block'
						) }
					</p>

					<ToggleControl
						label={ __(
							'Show start position (debug)',
							'inblock-map-block'
						) }
						checked={ !! showStartPosition }
						onChange={ ( value ) =>
							setAttributes( { showStartPosition: !! value } )
						}
					/>

					{ showStartPosition && (
						<>
							<RangeControl
								label={ __( 'Latitude', 'inblock-map-block' ) }
								value={ lat }
								onChange={ ( value ) =>
									setAttributes( { lat: value } )
								}
								min={ -90 }
								max={ 90 }
								step={ 0.0001 }
							/>
							<RangeControl
								label={ __( 'Longitude', 'inblock-map-block' ) }
								value={ lng }
								onChange={ ( value ) =>
									setAttributes( { lng: value } )
								}
								min={ -180 }
								max={ 180 }
								step={ 0.0001 }
							/>
							<RangeControl
								label={ __( 'Zoom', 'inblock-map-block' ) }
								value={ zoom }
								onChange={ ( value ) =>
									setAttributes( { zoom: value } )
								}
								min={ 1 }
								max={ 19 }
							/>
						</>
					) }
				</PanelBody>

				<PanelBody
					title={ __( 'Dimensions', 'inblock-map-block' ) }
					initialOpen={ false }
				>
					<RangeControl
						label={ __( 'Height (px)', 'inblock-map-block' ) }
						value={ height }
						onChange={ ( value ) =>
							setAttributes( { height: value } )
						}
						min={ 120 }
						max={ 900 }
						step={ 10 }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Markers', 'inblock-map-block' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __( 'Enable markers', 'inblock-map-block' ) }
						checked={ !! markersEnabled }
						onChange={ ( enabled ) =>
							setAttributes( { markersEnabled: !! enabled } )
						}
					/>

					{ markersEnabled && (
						<>
							<RadioControl
								label={ __(
									'Marker mode',
									'inblock-map-block'
								) }
								selected={ effectiveMarkersMode }
								options={ [
									{
										label: __(
											'Single',
											'inblock-map-block'
										),
										value: 'single',
									},
									{
										label: __(
											'Collection',
											'inblock-map-block'
										),
										value: 'collection',
									},
								] }
								onChange={ ( value ) =>
									setAttributes( { markersMode: value } )
								}
							/>

							<p className="components-base-control__help">
								{ effectiveMarkersMode === 'single'
									? __(
											'Uses the location of the current content.',
											'inblock-map-block'
									  )
									: __(
											'Lists locations from a selected content type.',
											'inblock-map-block'
									  ) }
							</p>

							{ effectiveMarkersMode === 'collection' && (
								<SelectControl
									label={ __(
										'Post type',
										'inblock-map-block'
									) }
									value={ markersPostType }
									options={ [
										{ label: '—', value: '' },
										...postTypeOptions,
									] }
									onChange={ ( value ) =>
										setAttributes( {
											markersPostType: value,
										} )
									}
								/>
							) }

							<div
								style={ {
									display: 'flex',
									alignItems: 'center',
									gap: 6,
									marginTop: 8,
								} }
							>
								<span>
									{ effectiveMarkersMode === 'single'
										? __(
												'Marker source',
												'inblock-map-block'
										  )
										: __(
												'Markers source',
												'inblock-map-block'
										  ) }
								</span>
								<MarkersSourceHelp />
							</div>

							<SelectControl
								label=""
								hideLabelFromVision={ true }
								value={ markersSource }
								options={ [
									{
										label: 'ACF Location field',
										value: 'acf_location',
									},
									{
										label: 'ACF text {lat,lng}',
										value: 'acf_text_latlng',
									},
									{
										label: __(
											'ACF Repeater / Multiple locations',
											'inblock-map-block'
										),
										value: 'acf_repeater',
									},
									{
										label: 'Post meta (lat/lng)',
										value: 'meta_latlng',
									},
								] }
								onChange={ ( value ) =>
									setAttributes( { markersSource: value } )
								}
							/>

							{ ( markersSource === 'acf_location' ||
								markersSource === 'acf_text_latlng' ) && (
								<TextControl
									label={ __(
										'ACF field name',
										'inblock-map-block'
									) }
									helperText={ 'Example: location' }
									value={ acfLocationField }
									onChange={ ( value ) =>
										setAttributes( {
											acfLocationField: value,
										} )
									}
								/>
							) }

							{ markersSource === 'acf_repeater' && (
								<>
									<SelectControl
										label={ __(
											'Repeater field',
											'inblock-map-block'
										) }
										value={ acfRepeaterField }
										options={ [
											{ label: '—', value: '' },
											...acfRepeaterOptions.map(
												( field ) => ( {
													label: `${ field.label } (${ field.name })`,
													value: field.name,
												} )
											),
										] }
										onChange={ ( value ) =>
											setAttributes( {
												acfRepeaterField: value,
												acfRepeaterCoordinatesField: '',
												acfRepeaterLabelField: '',
											} )
										}
									/>
									<SelectControl
										label={ __(
											'Coordinates sub-field',
											'inblock-map-block'
										) }
										value={ acfRepeaterCoordinatesField }
										options={ [
											{ label: '—', value: '' },
											...repeaterSubFields.map(
												( field ) => ( {
													label: `${ field.label } (${ field.name })`,
													value: field.name,
												} )
											),
										] }
										onChange={ ( value ) =>
											setAttributes( {
												acfRepeaterCoordinatesField:
													value,
											} )
										}
										helperText={ __(
											'Expected format: {latitude,longitude}',
											'inblock-map-block'
										) }
									/>
									<SelectControl
										label={ __(
											'Location label sub-field',
											'inblock-map-block'
										) }
										value={ acfRepeaterLabelField }
										options={ [
											{
												label: __(
													'None',
													'inblock-map-block'
												),
												value: '',
											},
											...repeaterSubFields
												.filter(
													( field ) =>
														field.name !==
														acfRepeaterCoordinatesField
												)
												.map( ( field ) => ( {
													label: `${ field.label } (${ field.name })`,
													value: field.name,
												} ) ),
										] }
										onChange={ ( value ) =>
											setAttributes( {
												acfRepeaterLabelField: value,
											} )
										}
									/>
								</>
							) }

							{ markersSource === 'meta_latlng' && (
								<>
									<TextControl
										label={ __(
											'Latitude meta key',
											'inblock-map-block'
										) }
										value={ latMetaKey }
										onChange={ ( value ) =>
											setAttributes( {
												latMetaKey: value,
											} )
										}
									/>
									<TextControl
										label={ __(
											'Longitude meta key',
											'inblock-map-block'
										) }
										value={ lngMetaKey }
										onChange={ ( value ) =>
											setAttributes( {
												lngMetaKey: value,
											} )
										}
									/>
								</>
							) }

							{ effectiveMarkersMode === 'collection' && (
								<RangeControl
									label={ __( 'Limit', 'inblock-map-block' ) }
									value={ markersLimit }
									onChange={ ( value ) =>
										setAttributes( { markersLimit: value } )
									}
									min={ 1 }
									max={ 500 }
								/>
							) }

							<ToggleControl
								label={ __(
									'Enable popup',
									'inblock-map-block'
								) }
								checked={ !! markersPopup }
								onChange={ ( value ) =>
									setAttributes( { markersPopup: !! value } )
								}
							/>

							<ToggleControl
								label={ __(
									'Auto fit to markers',
									'inblock-map-block'
								) }
								checked={ !! markersAutoFit }
								onChange={ ( value ) =>
									setAttributes( {
										markersAutoFit: !! value,
									} )
								}
							/>

							<ToggleControl
								label={ __(
									'Cluster nearby markers',
									'inblock-map-block'
								) }
								checked={ !! markersCluster }
								onChange={ ( value ) =>
									setAttributes( {
										markersCluster: !! value,
									} )
								}
							/>

							{ markersCluster && (
								<RangeControl
									label={ __(
										'Disable clustering at zoom',
										'inblock-map-block'
									) }
									value={ markersClusterDisableAtZoom }
									onChange={ ( value ) =>
										setAttributes( {
											markersClusterDisableAtZoom: value,
										} )
									}
									min={ 1 }
									max={ 19 }
								/>
							) }

							<SelectControl
								label={ __(
									'Marker style',
									'inblock-map-block'
								) }
								value={ markerStyle }
								options={ [
									{ label: 'Default', value: 'default' },
									{ label: 'Circle', value: 'circle' },
									{ label: 'Dot', value: 'dot' },
								] }
								onChange={ ( value ) =>
									setAttributes( { markerStyle: value } )
								}
							/>

							{ markerStyle === 'circle' && (
								<ColorPalette
									colors={ colors }
									value={ markerColor }
									onChange={ ( value ) =>
										setAttributes( { markerColor: value } )
									}
									disableCustomColors={ ! allowCustomColors }
									clearable={ false }
								/>
							) }
						</>
					) }
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div
					className="inblock-map-block__map"
					ref={ mapElRef }
					style={ { height: height + 'px' } }
				/>
			</div>
		</>
	);
}
