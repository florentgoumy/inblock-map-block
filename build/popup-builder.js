( function ( wp ) {
	'use strict';
	if ( ! wp || ! wp.hooks || ! wp.compose || ! wp.element || ! wp.components || ! wp.blockEditor || ! wp.apiFetch ) return;
	var el = wp.element.createElement;
	var Fragment = wp.element.Fragment;
	var useEffect = wp.element.useEffect;
	var useState = wp.element.useState;
	var PanelBody = wp.components.PanelBody;
	var SelectControl = wp.components.SelectControl;
	var RadioControl = wp.components.RadioControl;
	var TextControl = wp.components.TextControl;
	var ToggleControl = wp.components.ToggleControl;
	var Button = wp.components.Button;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var __ = wp.i18n.__;

	wp.hooks.addFilter( 'editor.BlockEdit', 'inblock-map-block/popup-builder', wp.compose.createHigherOrderComponent( function ( BlockEdit ) {
		return function ( props ) {
			var isMap = props.name === 'inblock/map-block';
			var attrs = props.attributes || {};
			var fields = Array.isArray( attrs.markerPopupFields ) ? attrs.markerPopupFields.slice( 0, 5 ) : [];
			var state = useState( [] );
			var available = state[ 0 ];
			var setAvailable = state[ 1 ];
			var mode = attrs.markersMode || ( attrs.markersPostType ? 'collection' : 'single' );
			var nativeOptions = [
				{ label: __( 'Excerpt', 'inblock-map-block' ), value: 'excerpt' },
				{ label: __( 'Featured image', 'inblock-map-block' ), value: 'featured_image' },
				{ label: __( 'Author', 'inblock-map-block' ), value: 'author' },
				{ label: __( 'Published date', 'inblock-map-block' ), value: 'published_date' },
				{ label: __( 'Content type', 'inblock-map-block' ), value: 'post_type' },
				{ label: __( 'Categories and terms', 'inblock-map-block' ), value: 'taxonomies' }
			];
			var postId = Number.parseInt( props.context && props.context.postId || wp.data && wp.data.select( 'core/editor' ).getCurrentPostId() || 0, 10 );

			useEffect( function () {
				if ( ! isMap || ! attrs.markersEnabled || ! attrs.markersPopup ) { setAvailable( [] ); return; }
				var query = new URLSearchParams( { post_id: String( postId || 0 ), post_type: mode === 'collection' ? ( attrs.markersPostType || '' ) : '' } );
				wp.apiFetch( { path: '/inblock-map-block/v1/acf-popup-fields?' + query.toString() } ).then( function ( result ) { setAvailable( Array.isArray( result ) ? result : [] ); } ).catch( function () { setAvailable( [] ); } );
			}, [ isMap, attrs.markersEnabled, attrs.markersPopup, attrs.markersPostType, mode, postId ] );

			function save( next ) { props.setAttributes( { markerPopupFields: next.slice( 0, 5 ) } ); }
			function update( index, values ) { var next = fields.slice(); next[ index ] = Object.assign( {}, next[ index ], values ); save( next ); }
			function move( index, delta ) { var next = fields.slice(); var target = index + delta; var item = next[ index ]; next[ index ] = next[ target ]; next[ target ] = item; save( next ); }

			var inspector = isMap && attrs.markersEnabled && attrs.markersPopup ? el( InspectorControls, {}, el( PanelBody, { title: __( 'Popup content', 'inblock-map-block' ), initialOpen: false },
				el( ToggleControl, { label: __( 'Show title', 'inblock-map-block' ), checked: attrs.markerPopupShowTitle !== false, onChange: function ( value ) { props.setAttributes( { markerPopupShowTitle: !! value } ); } } ),
				el( ToggleControl, { label: __( 'Show details link', 'inblock-map-block' ), checked: attrs.markerPopupShowLink !== false, onChange: function ( value ) { props.setAttributes( { markerPopupShowLink: !! value } ); } } ),
				attrs.markerPopupShowLink !== false ? el( Fragment, {},
					el( TextControl, { label: __( 'Details link label', 'inblock-map-block' ), value: attrs.markerDetailsLinkLabel || '', placeholder: __( 'Plus d’infos', 'inblock-map-block' ), onChange: function ( value ) { props.setAttributes( { markerDetailsLinkLabel: value } ); } } ),
					el( RadioControl, { label: __( 'Link presentation', 'inblock-map-block' ), selected: attrs.markerPopupLinkStyle || 'link', options: [ { label: __( 'Text link', 'inblock-map-block' ), value: 'link' }, { label: __( 'Button', 'inblock-map-block' ), value: 'button' } ], onChange: function ( value ) { props.setAttributes( { markerPopupLinkStyle: value } ); } } )
				) : null,
				el( 'hr', {} ),
				el( 'p', { className: 'components-base-control__help' }, __( 'Add up to 5 WordPress or ACF fields. Empty values are hidden automatically.', 'inblock-map-block' ) ),
				fields.map( function ( field, index ) {
					var source = field.source || 'acf';
					var options = available.filter( function ( candidate ) { return candidate.name === field.name || ! fields.some( function ( selected ) { return ( selected.source || 'acf' ) === 'acf' && selected.name === candidate.name; } ); } );
					var filteredNativeOptions = nativeOptions.filter( function ( candidate ) { return candidate.value === field.key || ! fields.some( function ( selected ) { return selected.source === 'wordpress' && selected.key === candidate.value; } ); } );
					return el( 'div', { key: field.name + index, style: { border: '1px solid #ddd', padding: '10px', marginBottom: '10px' } },
						el( SelectControl, { label: __( 'Field source', 'inblock-map-block' ), value: source, options: [ { label: 'WordPress', value: 'wordpress' }, { label: 'ACF', value: 'acf' } ], onChange: function ( value ) { update( index, value === 'wordpress' ? { source: value, key: 'excerpt', name: '', label: __( 'Excerpt', 'inblock-map-block' ), showLabel: false } : { source: value, key: '', name: available[ 0 ] ? available[ 0 ].name : '', label: available[ 0 ] ? available[ 0 ].label : '', showLabel: false } ); } } ),
						source === 'wordpress'
							? el( SelectControl, { label: __( 'WordPress field', 'inblock-map-block' ), value: field.key || 'excerpt', options: filteredNativeOptions, onChange: function ( key ) { var selected = nativeOptions.find( function ( item ) { return item.value === key; } ); update( index, { key: key, label: selected ? selected.label : '' } ); } } )
							: el( SelectControl, { label: __( 'ACF field', 'inblock-map-block' ), value: field.name || '', options: [ { label: '—', value: '' } ].concat( options.map( function ( item ) { return { label: item.label + ' (' + item.name + ')', value: item.name }; } ) ), onChange: function ( name ) { var selected = available.find( function ( item ) { return item.name === name; } ); update( index, { name: name, label: selected ? selected.label : '' } ); } } ),
						el( ToggleControl, { label: __( 'Show label', 'inblock-map-block' ), checked: field.showLabel !== false, onChange: function ( showLabel ) { update( index, { showLabel: showLabel } ); } } ),
						field.showLabel !== false ? el( TextControl, { label: __( 'Custom label', 'inblock-map-block' ), value: field.label || '', onChange: function ( label ) { update( index, { label: label } ); } } ) : null,
						el( 'div', { style: { display: 'flex', gap: '6px' } },
							el( Button, { variant: 'secondary', size: 'small', disabled: index === 0, onClick: function () { move( index, -1 ); } }, __( 'Up', 'inblock-map-block' ) ),
							el( Button, { variant: 'secondary', size: 'small', disabled: index === fields.length - 1, onClick: function () { move( index, 1 ); } }, __( 'Down', 'inblock-map-block' ) ),
							el( Button, { variant: 'tertiary', size: 'small', isDestructive: true, onClick: function () { save( fields.filter( function ( item, itemIndex ) { return itemIndex !== index; } ) ); } }, __( 'Remove', 'inblock-map-block' ) )
						)
					);
				} ),
				el( Button, { variant: 'secondary', disabled: fields.length >= 5, onClick: function () { var firstNative = nativeOptions.find( function ( item ) { return ! fields.some( function ( selected ) { return selected.source === 'wordpress' && selected.key === item.value; } ); } ); var firstAcf = available.find( function ( item ) { return ! fields.some( function ( selected ) { return ( selected.source || 'acf' ) === 'acf' && selected.name === item.name; } ); } ); if ( firstNative ) save( fields.concat( [ { source: 'wordpress', key: firstNative.value, label: firstNative.label, showLabel: false } ] ) ); else if ( firstAcf ) save( fields.concat( [ { source: 'acf', name: firstAcf.name, label: firstAcf.label, showLabel: false } ] ) ); } }, __( 'Add field', 'inblock-map-block' ) ),
				fields.length >= 5 ? el( 'p', { className: 'components-base-control__help' }, __( 'Maximum of 5 fields reached.', 'inblock-map-block' ) ) : null
			) ) : null;
			return el( Fragment, {}, el( BlockEdit, props ), inspector );
		};
	}, 'withInblockPopupBuilder' ) );
}( window.wp ) );
