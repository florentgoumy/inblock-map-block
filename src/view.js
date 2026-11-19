import L from 'leaflet';
import 'leaflet.markercluster';
import '@maplibre/maplibre-gl-leaflet';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import './leaflet-icons';
import {
	configureMapLibreWorker,
	createBaseLayer,
	getTileConfig,
} from './tile';

configureMapLibreWorker( maplibregl );

function escapeHtml( str ) {
	return String( str )
		.replaceAll( '&', '&amp;' )
		.replaceAll( '<', '&lt;' )
		.replaceAll( '>', '&gt;' )
		.replaceAll( '"', '&quot;' )
		.replaceAll( "'", '&#039;' );
}

function parseBool( v ) {
	return v === '1' || v === 'true' || v === 1 || v === true;
}

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
					'" loading="lazy"></div>'
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

function readMarkers( root ) {
	const script = root.querySelector( '.inblock-map-block__markers' );
	if ( ! script?.textContent ) {
		return [];
	}
	try {
		const data = JSON.parse( script.textContent );
		return Array.isArray( data ) ? data : [];
	} catch ( e ) {
		return [];
	}
}

function getCustomMarkerIcon( root ) {
	const enabled = parseBool( root.dataset.customMarkerEnabled );
	const url = root.dataset.customMarkerUrl;
	if ( ! enabled || ! url ) {
		return null;
	}
	const w = Number.parseInt( root.dataset.customMarkerWidth || '32', 10 );
	const h = Number.parseInt( root.dataset.customMarkerHeight || '32', 10 );
	const ax = Number.parseInt(
		root.dataset.customMarkerAnchorX || String( Math.round( w / 2 ) ),
		10
	);
	const ay = Number.parseInt(
		root.dataset.customMarkerAnchorY || String( h ),
		10
	);

	return L.icon( {
		iconUrl: url,
		iconSize: [ w, h ],
		iconAnchor: [ ax, ay ],
	} );
}

function createMarker( root, markerStyle, markerColor, point ) {
	const lat = point.lat;
	const lng = point.lng;

	if ( markerStyle === 'circle' ) {
		return L.circleMarker( [ lat, lng ], {
			radius: 8,
			color: markerColor,
			fillColor: markerColor,
			fillOpacity: 0.9,
			weight: 2,
		} );
	}

	if ( markerStyle === 'dot' ) {
		return L.circleMarker( [ lat, lng ], {
			radius: 5,
			color: markerColor,
			fillColor: markerColor,
			fillOpacity: 0.9,
			weight: 2,
		} );
	}

	const icon = getCustomMarkerIcon( root );
	if ( icon ) {
		return L.marker( [ lat, lng ], { icon } );
	}

	return L.marker( [ lat, lng ] );
}

function initMap( root ) {
	const lat = Number.parseFloat( root.dataset.lat || '0' );
	const lng = Number.parseFloat( root.dataset.lng || '0' );
	const zoom = Number.parseInt( root.dataset.zoom || '12', 10 );
	const height = Number.parseInt( root.dataset.height || '320', 10 );
	root.style.height = height + 'px';

	const baseMap = root.dataset.baseMap || 'osm';
	const customBaseMap = {
		enabled: parseBool( root.dataset.customBaseMapEnabled ),
		type: root.dataset.customBaseMapType || 'xyz',
		url: root.dataset.customBaseMapUrl || '',
		styleUrl: root.dataset.customMaplibreStyleUrl || '',
		attribution: root.dataset.customBaseMapAttribution || '',
	};
	let baseMapColors = {};
	try {
		baseMapColors = JSON.parse( root.dataset.baseMapColors || '{}' );
	} catch ( error ) {}

	const markerStyle = root.dataset.markerStyle || 'default';
	const markerDetailsLinkLabel =
		root.dataset.markerDetailsLinkLabel || 'Plus d’infos';
	const popupShowTitle =
		root.dataset.popupShowTitle === undefined ||
		parseBool( root.dataset.popupShowTitle );
	const popupShowLink =
		root.dataset.popupShowLink === undefined ||
		parseBool( root.dataset.popupShowLink );
	const popupLinkStyle =
		root.dataset.popupLinkStyle === 'button' ? 'button' : 'link';
	const markerColor = root.dataset.markerColor || '#2563eb';
	const markersEnabled = parseBool( root.dataset.markersEnabled );

	const map = L.map( root, {
		zoomControl: true,
		attributionControl: true,
	} ).setView( [ lat, lng ], zoom );

	const tile = getTileConfig( baseMap, customBaseMap );
	createBaseLayer( L, tile, {
		colors: baseMapColors,
		onLoading: () => root.classList.add( 'is-map-loading' ),
		onLoad: () => {
			root.classList.remove( 'is-map-loading', 'has-map-error' );
			root.removeAttribute( 'aria-label' );
		},
		onError: () => {
			root.classList.remove( 'is-map-loading' );
			root.classList.add( 'has-map-error' );
			root.setAttribute(
				'aria-label',
				'The map provider could not be loaded.'
			);
		},
	} ).addTo( map );

	if ( ! markersEnabled ) {
		return;
	}

	const markers = readMarkers( root.parentElement || root );
	if ( markers.length === 0 ) {
		return;
	}

	const markersPopup = parseBool( root.dataset.markersPopup );
	const markersAutoFit = parseBool( root.dataset.markersAutoFit );
	const markersCluster = parseBool( root.dataset.markersCluster );
	const clusterDisableAtZoom = Number.parseInt(
		root.dataset.markersClusterDisableAtZoom || '18',
		10
	);

	const bounds = [];

	let layer = L.layerGroup();
	if ( markersCluster ) {
		layer = L.markerClusterGroup( {
			disableClusteringAtZoom: clusterDisableAtZoom,
		} );
	}

	markers.forEach( ( m ) => {
		if ( typeof m?.lat !== 'number' || typeof m?.lng !== 'number' ) {
			return;
		}
		bounds.push( [ m.lat, m.lng ] );

		const marker = createMarker( root, markerStyle, markerColor, m );

		root.dispatchEvent(
			new CustomEvent( 'inblock-map-block:marker-created', {
				bubbles: true,
				detail: { root, marker, point: m },
			} )
		);

		if ( markersPopup ) {
			root.dispatchEvent(
				new CustomEvent( 'inblock-map-block:before-popup', {
					bubbles: true,
					detail: { root, marker, point: m },
				} )
			);

			if ( marker.getPopup() ) {
				layer.addLayer( marker );
				return;
			}
			const title = escapeHtml( m.title || '' );
			const url = escapeHtml( m.url || '' );
			const linkLabel = escapeHtml(
				markerDetailsLinkLabel.trim() || 'Plus d’infos'
			);
			const locationLabel = escapeHtml( m.locationLabel || '' );
			const html =
				'<div class="inblock-map-block__popup">' +
				( popupShowTitle && title
					? '<strong>' + title + '</strong>'
					: '' ) +
				( locationLabel
					? '<div class="inblock-map-block__popup-location">' +
					  locationLabel +
					  '</div>'
					: '' ) +
				popupFieldsHtml( m.popupFields ) +
				( popupShowLink && url
					? '<div><a href="' +
					  url +
					  ( popupLinkStyle === 'button'
							? '" class="inblock-map-block__popup-button'
							: '' ) +
					  '">' +
					  linkLabel +
					  '</a></div>'
					: '' ) +
				'</div>';
			marker.bindPopup( html );
		}

		layer.addLayer( marker );
	} );

	layer.addTo( map );

	if ( markersAutoFit && bounds.length >= 1 ) {
		if ( bounds.length === 1 ) {
			map.setView( bounds[ 0 ], zoom );
		} else {
			map.fitBounds( bounds, { padding: [ 20, 20 ] } );
		}
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	document
		.querySelectorAll( '.inblock-map-block__map' )
		.forEach( ( el ) => initMap( el ) );
} );
