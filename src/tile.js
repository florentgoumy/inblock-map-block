export function getTileConfig( baseMap ) {
	if ( baseMap === 'carto_positron' ) {
		return {
			url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
			attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
			maxZoom: 19,
		};
	}

	if ( baseMap === 'carto_dark' ) {
		return {
			url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
			attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
			maxZoom: 19,
		};
	}

	if ( baseMap === 'opentopo' ) {
		return {
			url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
			attribution:
				'&copy; OpenStreetMap contributors, SRTM | OpenTopoMap',
			maxZoom: 17,
		};
	}

	return {
		url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		attribution: '&copy; OpenStreetMap contributors',
		maxZoom: 19,
	};
}
