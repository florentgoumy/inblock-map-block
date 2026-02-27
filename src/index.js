import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';

registerBlockType('inblock/map-block', {
  apiVersion: 2,
  title: 'Inblock Map Block',
  icon: 'location',
  category: 'widgets',
  attributes: {
    lat: { type: 'number', default: 48.8566 },
    lng: { type: 'number', default: 2.3522 },
    zoom: { type: 'number', default: 12 }
  },
  edit: Edit,
  save: () => null
});
