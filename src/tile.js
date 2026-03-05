export function getTileConfig( baseMap, custom = null ) {
	if ( custom && custom.enabled && custom.url ) {
		return {
			url: custom.url,
			attribution: custom.attribution || '',
			maxZoom: custom.maxZoom || 19,
		};
	}

	// "Safe" defaults only: well-known providers, still requires attribution.
	switch ( baseMap ) {
		case 'carto_positron':
			return {
				url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				maxZoom: 20,
			};
		case 'carto_dark':
			return {
				url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				maxZoom: 20,
			};
		case 'osm':
		default:
			return {
				url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				maxZoom: 19,
			};
	}
}
