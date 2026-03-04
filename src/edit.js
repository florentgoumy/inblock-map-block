import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
	Tooltip,
	Icon,
	ColorPalette,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import L from 'leaflet';

import './leaflet-icons';

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

function MarkersSourceHelp() {
	const content = (
		<div>
			<div>
				<strong>ACF Location</strong>: field returning an object with
				<code>lat</code>/<code>lng</code>.
			</div>
			<div>
				<strong>ACF text</strong>: text field with <code>lat,lng</code>{ ' ' }
				or
				<code>\u007Blat,lng\u007D</code>.
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

export default function Edit( { attributes, setAttributes } ) {
	const {
		lat,
		lng,
		zoom,
		height,
		markersEnabled,
		markersPostType,
		markersSource,
		acfLocationField,
		latMetaKey,
		lngMetaKey,
		markersLimit,
		markersPopup,
		markersAutoFit,
		markerStyle,
		markerColor,
	} = attributes;

	const [ postTypeOptions, setPostTypeOptions ] = useState( [] );

	const mapElRef = useRef( null );
	const mapRef = useRef( null );

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
		if ( ! mapElRef.current || mapRef.current ) {
			return;
		}

		const map = L.map( mapElRef.current, {
			zoomControl: true,
			attributionControl: true,
		} ).setView( [ lat, lng ], zoom );

		L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; OpenStreetMap contributors',
		} ).addTo( map );

		mapRef.current = map;

		map.on( 'moveend', () => {
			const center = map.getCenter();
			setAttributes( {
				lat: Number.parseFloat( center.lat.toFixed( 6 ) ),
				lng: Number.parseFloat( center.lng.toFixed( 6 ) ),
			} );
		} );

		map.on( 'zoomend', () => {
			setAttributes( { zoom: map.getZoom() } );
		} );

		setTimeout( () => map.invalidateSize(), 0 );

		return () => {
			map.remove();
			mapRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		if ( ! mapRef.current ) {
			return;
		}
		mapRef.current.setView( [ lat, lng ], zoom, { animate: false } );
	}, [ lat, lng, zoom ] );

	useEffect( () => {
		if ( ! mapRef.current ) {
			return;
		}
		setTimeout( () => mapRef.current.invalidateSize(), 0 );
	}, [ height ] );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Map settings', 'inblock-map-block' ) }
					initialOpen
				>
					<p>
						{ __(
							'Déplacez la carte et zoomez pour définir la vue par défaut.',
							'inblock-map-block'
						) }
					</p>
				</PanelBody>

				<PanelBody
					title={ __( 'Advanced', 'inblock-map-block' ) }
					initialOpen={ false }
				>
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
							<SelectControl
								label={ __( 'Post type', 'inblock-map-block' ) }
								value={ markersPostType }
								options={ [
									{ label: '—', value: '' },
									...postTypeOptions,
								] }
								onChange={ ( value ) =>
									setAttributes( { markersPostType: value } )
								}
							/>

							<div
								style={ {
									display: 'flex',
									alignItems: 'center',
									gap: 6,
									marginTop: 8,
								} }
							>
								<span>
									{ __(
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

							<RangeControl
								label={ __( 'Limit', 'inblock-map-block' ) }
								value={ markersLimit }
								onChange={ ( value ) =>
									setAttributes( { markersLimit: value } )
								}
								min={ 1 }
								max={ 500 }
							/>

							<ToggleControl
								label={ __(
									'Popup (title + link)',
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

							<SelectControl
								label={ __(
									'Marker style',
									'inblock-map-block'
								) }
								value={ markerStyle }
								options={ [
									{ label: 'Default', value: 'default' },
									{ label: 'Circle', value: 'circle' },
								] }
								onChange={ ( value ) =>
									setAttributes( { markerStyle: value } )
								}
							/>

							{ markerStyle === 'circle' && (
								<ColorPalette
									value={ markerColor }
									onChange={ ( value ) =>
										setAttributes( { markerColor: value } )
									}
									clearable={ false }
								/>
							) }
						</>
					) }
				</PanelBody>
			</InspectorControls>

			<div { ...useBlockProps() }>
				<div
					className="inblock-map-block__map"
					ref={ mapElRef }
					style={ { height: height + 'px' } }
				/>
			</div>
		</>
	);
}
