import L from 'leaflet';
import 'leaflet.markercluster';

import './leaflet-icons';
import { getTileConfig } from './tile';

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
		url: root.dataset.customBaseMapUrl || '',
		attribution: root.dataset.customBaseMapAttribution || '',
	};

	const markerStyle = root.dataset.markerStyle || 'default';
	const markerColor = root.dataset.markerColor || '#2563eb';
	const markersEnabled = parseBool( root.dataset.markersEnabled );

	const map = L.map( root, {
		zoomControl: true,
		attributionControl: true,
	} ).setView( [ lat, lng ], zoom );

	const tile = getTileConfig( baseMap, customBaseMap );
	L.tileLayer( tile.url, {
		maxZoom: tile.maxZoom,
		attribution: tile.attribution,
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

		if ( markersPopup ) {
			const title = escapeHtml( m.title || '' );
			const url = escapeHtml( m.url || '' );
			const html =
				'<div class="inblock-map-block__popup">' +
				( title ? '<strong>' + title + '</strong>' : '' ) +
				( url
					? '<div><a href="' + url + '">' + url + '</a></div>'
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
