import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import './style.scss';

registerBlockType( 'inblock/map-block', {
	apiVersion: 2,
	title: 'Inblock Map Block',
	icon: 'location',
	category: 'widgets',
	edit: Edit,
	save: () => null,
} );
