import L from 'leaflet';

function initMap( el ) {
	const lat = Number.parseFloat( el.dataset.lat || '0' );
	const lng = Number.parseFloat( el.dataset.lng || '0' );
	const zoom = Number.parseInt( el.dataset.zoom || '12', 10 );

	if ( Number.isNaN( lat ) || Number.isNaN( lng ) || Number.isNaN( zoom ) ) {
		return;
	}

	const map = L.map( el, {
		zoomControl: true,
		attributionControl: true,
	} ).setView( [ lat, lng ], zoom );

	L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; OpenStreetMap contributors',
	} ).addTo( map );

	L.marker( [ lat, lng ], { draggable: false } ).addTo( map );
}

window.addEventListener( 'DOMContentLoaded', () => {
	document
		.querySelectorAll( '.inblock-map-block__map[data-lat][data-lng]' )
		.forEach( ( el ) => initMap( el ) );
} );
