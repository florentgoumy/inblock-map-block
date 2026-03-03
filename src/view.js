import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions( {
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
} );

function safeJsonParse( text ) {
	try {
		return JSON.parse( text );
	} catch ( e ) {
		return null;
	}
}

function initMap( el ) {
	const lat = Number.parseFloat( el.dataset.lat || '0' );
	const lng = Number.parseFloat( el.dataset.lng || '0' );
	const zoom = Number.parseInt( el.dataset.zoom || '12', 10 );

	if ( Number.isNaN( lat ) || Number.isNaN( lng ) || Number.isNaN( zoom ) ) {
		return;
	}

	const height = Number.parseInt( el.dataset.height || '320', 10 );
	if ( ! Number.isNaN( height ) ) {
		el.style.height = height + 'px';
	}

	const markersPopup = el.dataset.markersPopup === '1';
	const markersAutoFit = el.dataset.markersAutoFit === '1';

	const map = L.map( el, {
		zoomControl: true,
		attributionControl: true,
	} ).setView( [ lat, lng ], zoom );

	L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; OpenStreetMap contributors',
	} ).addTo( map );

	const markers = [
		{
			lat,
			lng,
			title: null,
			url: null,
		},
	];

	const markersScript = el
		.closest( '.wp-block-inblock-map-block' )
		?.querySelector( '.inblock-map-block__markers' );

	if ( markersScript?.textContent ) {
		const parsed = safeJsonParse( markersScript.textContent );
		if ( Array.isArray( parsed ) && parsed.length ) {
			markers.splice( 0, markers.length, ...parsed );
		}
	}

	const bounds = [];

	markers.forEach( ( m ) => {
		if ( typeof m?.lat !== 'number' || typeof m?.lng !== 'number' ) {
			return;
		}

		const marker = L.marker( [ m.lat, m.lng ], { draggable: false } ).addTo(
			map
		);

		bounds.push( [ m.lat, m.lng ] );

		if ( markersPopup && m.title ) {
			const title = m.url
				? `<a href=\"${ m.url }\">${ m.title }</a>`
				: m.title;
			marker.bindPopup( title );
		}
	} );

	if ( markersAutoFit && bounds.length > 1 ) {
		map.fitBounds( bounds, { padding: [ 20, 20 ] } );
	}
}

window.addEventListener( 'DOMContentLoaded', () => {
	document
		.querySelectorAll( '.inblock-map-block__map[data-lat][data-lng]' )
		.forEach( ( el ) => initMap( el ) );
} );
