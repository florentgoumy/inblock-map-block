export function getTileConfig( baseMap, custom = null ) {
	if (
		custom &&
		custom.enabled &&
		custom.type === 'maplibre' &&
		custom.styleUrl
	) {
		return {
			type: 'vector',
			style: custom.styleUrl,
		};
	}

	if (
		custom &&
		custom.enabled &&
		custom.type !== 'maplibre' &&
		custom.url
	) {
		return {
			type: 'raster',
			url: custom.url,
			attribution: custom.attribution || '',
			maxZoom: custom.maxZoom || 19,
		};
	}

	// "Safe" defaults only: well-known providers, still requires attribution.
	switch ( baseMap ) {
		case 'openfreemap_liberty':
		case 'openfreemap_bright':
		case 'openfreemap_dark':
		case 'openfreemap_fiord':
		case 'openfreemap_positron':
			return {
				type: 'vector',
				style: `https://tiles.openfreemap.org/styles/${ baseMap.replace(
					'openfreemap_',
					''
				) }`,
			};
		case 'openfreemap_3d':
			return {
				type: 'vector',
				style: 'https://tiles.openfreemap.org/styles/liberty',
				pitch: 45,
			};
		case 'osm':
		default:
			return {
				type: 'raster',
				url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				maxZoom: 19,
			};
	}
}

export const BASE_MAP_DESCRIPTIONS = {
	osm: 'Standard raster map. Familiar and detailed.',
	openfreemap_liberty: 'Balanced, colorful and highly readable.',
	openfreemap_positron: 'Light and discreet, ideal for highlighting markers.',
	openfreemap_bright: 'Bright and contrasted for general-purpose maps.',
	openfreemap_dark: 'Dark background with strong visual contrast.',
	openfreemap_fiord: 'Muted blue-gray style for a more editorial appearance.',
	openfreemap_3d:
		'Tilted Liberty perspective inspired by the OpenFreeMap 3D demo. More demanding on the browser.',
};

function setPaintColor( map, layer, property, color ) {
	if (
		! color ||
		! layer.paint ||
		! Object.prototype.hasOwnProperty.call( layer.paint, property )
	) {
		return;
	}
	try {
		map.setPaintProperty( layer.id, property, color );
	} catch ( error ) {}
}

export function applySemanticColors( map, colors = {} ) {
	const layers = map?.getStyle?.()?.layers || [];
	layers.forEach( ( layer ) => {
		const sourceLayer = layer[ 'source-layer' ] || '';
		if ( layer.type === 'background' ) {
			setPaintColor( map, layer, 'background-color', colors.background );
		} else if ( sourceLayer === 'water' ) {
			setPaintColor( map, layer, 'fill-color', colors.water );
			setPaintColor( map, layer, 'line-color', colors.water );
		} else if ( sourceLayer === 'waterway' ) {
			setPaintColor( map, layer, 'line-color', colors.water );
		} else if (
			[ 'landcover', 'landuse', 'park' ].includes( sourceLayer )
		) {
			setPaintColor( map, layer, 'fill-color', colors.nature );
		} else if ( sourceLayer === 'transportation' ) {
			setPaintColor( map, layer, 'line-color', colors.roads );
		} else if ( sourceLayer === 'building' ) {
			setPaintColor( map, layer, 'fill-color', colors.buildings );
			setPaintColor(
				map,
				layer,
				'fill-extrusion-color',
				colors.buildings
			);
		}

		if ( layer.type === 'symbol' ) {
			setPaintColor( map, layer, 'text-color', colors.labels );
			setPaintColor( map, layer, 'text-halo-color', colors.labelHalo );
		}
	} );
}

export function createBaseLayer( L, config, options = {} ) {
	options.onLoading?.();
	if ( config.type === 'vector' && typeof L.maplibreGL === 'function' ) {
		const layer = L.maplibreGL( {
			style: config.style,
			interactive: false,
		} );
		layer.once( 'add', () => {
			const map = layer.getMaplibreMap?.();
			if ( ! map ) {
				options.onError?.();
				return;
			}
			map.once( 'load', () => {
				if ( config.pitch ) {
					map.setPitch( config.pitch || 45 );
				}
				applySemanticColors( map, options.colors );
				options.onLoad?.();
			} );
			map.on( 'error', () => options.onError?.() );
		} );
		return layer;
	}

	const layer = L.tileLayer( config.url, {
		maxZoom: config.maxZoom,
		attribution: config.attribution,
	} );
	layer.once( 'load', () => options.onLoad?.() );
	layer.on( 'tileerror', () => options.onError?.() );
	return layer;
}

export function configureMapLibreWorker( maplibregl ) {
	const script = Array.from( document.scripts ).find( ( item ) =>
		/\/build\/(?:index|view)\.js(?:\?|$)/.test( item.src )
	);
	if ( script?.src ) {
		maplibregl.setWorkerUrl(
			new URL( 'maplibre-gl-csp-worker.js', script.src ).href
		);
	}
}
