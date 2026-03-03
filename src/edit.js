import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import L from 'leaflet';

async function fetchPostTypes() {
	const data = await apiFetch( { path: '/wp/v2/types?context=edit' } );
	if ( ! data ) {
		return [];
	}

	return Object.values( data )
		.filter( ( t ) => t?.visibility?.public )
		.map( ( t ) => ( {
			label: t.name,
			value: t.slug,
		} ) );
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
	} = attributes;

	const [ postTypeOptions, setPostTypeOptions ] = useState( [] );

	const mapElRef = useRef( null );
	const mapRef = useRef( null );
	const markerRef = useRef( null );

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

		const marker = L.marker( [ lat, lng ], { draggable: true } ).addTo(
			map
		);

		mapRef.current = map;
		markerRef.current = marker;

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

		marker.on( 'dragend', () => {
			const pos = marker.getLatLng();
			setAttributes( {
				lat: Number.parseFloat( pos.lat.toFixed( 6 ) ),
				lng: Number.parseFloat( pos.lng.toFixed( 6 ) ),
			} );
		} );

		setTimeout( () => map.invalidateSize(), 0 );

		return () => {
			map.remove();
			mapRef.current = null;
			markerRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		if ( ! mapRef.current ) {
			return;
		}
		mapRef.current.setView( [ lat, lng ], zoom, { animate: false } );
		if ( markerRef.current ) {
			markerRef.current.setLatLng( [ lat, lng ] );
		}
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
					initialOpen={ true }
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
									setAttributes( {
										markersPostType: value,
									} )
								}
							/>

							<SelectControl
								label={ __(
									'Markers source',
									'inblock-map-block'
								) }
								value={ markersSource }
								options={ [
									{
										label: 'ACF Location field',
										value: 'acf_location',
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

							{ markersSource === 'acf_location' && (
								<TextControl
									label={ __(
										'ACF field name',
										'inblock-map-block'
									) }
									helperText={
										'Example: location (expects {lat, lng})'
									}
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
