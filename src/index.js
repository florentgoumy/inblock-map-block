import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import './style.scss';

registerBlockType( 'inblock/map-block', {
	apiVersion: 2,
	title: 'Inblock Map Block',
	icon: 'location',
	category: 'widgets',
	attributes: {
		lat: { type: 'number', default: 48.8566 },
		lng: { type: 'number', default: 2.3522 },
		zoom: { type: 'number', default: 12 },
		height: { type: 'number', default: 320 },
		markersEnabled: { type: 'boolean', default: false },
		markersPostType: { type: 'string', default: '' },
		markersSource: { type: 'string', default: 'acf_location' },
		acfLocationField: { type: 'string', default: 'location' },
		latMetaKey: { type: 'string', default: 'inblock_lat' },
		lngMetaKey: { type: 'string', default: 'inblock_lng' },
		markersLimit: { type: 'number', default: 100 },
		markersPopup: { type: 'boolean', default: true },
		markersAutoFit: { type: 'boolean', default: true },
	},
	edit: Edit,
	save: () => null,
} );
