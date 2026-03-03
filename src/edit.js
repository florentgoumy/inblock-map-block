import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import L from 'leaflet';

export default function Edit( { attributes, setAttributes } ) {
	const { lat, lng, zoom, height } = attributes;
	const mapElRef = useRef( null );
	const mapRef = useRef( null );
	const markerRef = useRef( null );

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
