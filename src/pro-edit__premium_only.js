import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const premiumAttributes = {
	proTaxonomy: { type: 'string', default: '' },
	proTerm: { type: 'string', default: '' },
	proMetaKey: { type: 'string', default: '' },
	proMetaValue: { type: 'string', default: '' },
	proOrderBy: { type: 'string', default: 'date' },
	proOrder: { type: 'string', default: 'DESC' },
	proPopupImage: { type: 'boolean', default: false },
	proPopupExcerpt: { type: 'boolean', default: false },
	proPopupMetaKeys: { type: 'string', default: '' },
	proMarkerColorTaxonomy: { type: 'string', default: '' },
	proMarkerColorRules: { type: 'string', default: '' },
};

addFilter(
	'blocks.registerBlockType',
	'inblock-map-block/pro-attributes',
	( settings, name ) => {
		if ( name !== 'inblock/map-block' ) {
			return settings;
		}

		return {
			...settings,
			attributes: {
				...settings.attributes,
				...premiumAttributes,
			},
		};
	}
);

const withPremiumControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name !== 'inblock/map-block' ) {
			return <BlockEdit { ...props } />;
		}

		const { attributes, setAttributes } = props;

		return (
			<Fragment>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody
						title={ __( 'Advanced data · Pro', 'inblock-map-block' ) }
						initialOpen={ false }
					>
						<TextControl
							label={ __( 'Taxonomy', 'inblock-map-block' ) }
							help={ __( 'Example: category, location_type', 'inblock-map-block' ) }
							value={ attributes.proTaxonomy || '' }
							onChange={ ( value ) => setAttributes( { proTaxonomy: value } ) }
						/>
						<TextControl
							label={ __( 'Term slug', 'inblock-map-block' ) }
							help={ __( 'Only display posts assigned to this term.', 'inblock-map-block' ) }
							value={ attributes.proTerm || '' }
							onChange={ ( value ) => setAttributes( { proTerm: value } ) }
						/>
						<TextControl
							label={ __( 'Meta key', 'inblock-map-block' ) }
							value={ attributes.proMetaKey || '' }
							onChange={ ( value ) => setAttributes( { proMetaKey: value } ) }
						/>
						<TextControl
							label={ __( 'Meta value', 'inblock-map-block' ) }
							help={ __( 'Leave empty to only require the meta key.', 'inblock-map-block' ) }
							value={ attributes.proMetaValue || '' }
							onChange={ ( value ) => setAttributes( { proMetaValue: value } ) }
						/>
						<SelectControl
							label={ __( 'Order by', 'inblock-map-block' ) }
							value={ attributes.proOrderBy || 'date' }
							options={ [
								{ label: __( 'Date', 'inblock-map-block' ), value: 'date' },
								{ label: __( 'Title', 'inblock-map-block' ), value: 'title' },
								{ label: __( 'Menu order', 'inblock-map-block' ), value: 'menu_order' },
								{ label: __( 'Modified date', 'inblock-map-block' ), value: 'modified' },
								{ label: __( 'Random', 'inblock-map-block' ), value: 'rand' },
							] }
							onChange={ ( value ) => setAttributes( { proOrderBy: value } ) }
						/>
						<SelectControl
							label={ __( 'Order', 'inblock-map-block' ) }
							value={ attributes.proOrder || 'DESC' }
							options={ [
								{ label: 'Descending', value: 'DESC' },
								{ label: 'Ascending', value: 'ASC' },
							] }
							onChange={ ( value ) => setAttributes( { proOrder: value } ) }
						/>
					</PanelBody>

					<PanelBody
						title={ __( 'Rich popups · Pro', 'inblock-map-block' ) }
						initialOpen={ false }
					>
						<ToggleControl
							label={ __( 'Featured image', 'inblock-map-block' ) }
							checked={ !! attributes.proPopupImage }
							onChange={ ( value ) => setAttributes( { proPopupImage: !! value } ) }
						/>
						<ToggleControl
							label={ __( 'Excerpt', 'inblock-map-block' ) }
							checked={ !! attributes.proPopupExcerpt }
							onChange={ ( value ) => setAttributes( { proPopupExcerpt: !! value } ) }
						/>
						<TextControl
							label={ __( 'Custom fields', 'inblock-map-block' ) }
							help={ __( 'Comma-separated post meta keys.', 'inblock-map-block' ) }
							value={ attributes.proPopupMetaKeys || '' }
							onChange={ ( value ) => setAttributes( { proPopupMetaKeys: value } ) }
						/>
					</PanelBody>

					<PanelBody
						title={ __( 'Conditional markers · Pro', 'inblock-map-block' ) }
						initialOpen={ false }
					>
						<TextControl
							label={ __( 'Taxonomy', 'inblock-map-block' ) }
							help={ __( 'Choose the taxonomy used to color markers.', 'inblock-map-block' ) }
							value={ attributes.proMarkerColorTaxonomy || '' }
							onChange={ ( value ) =>
								setAttributes( { proMarkerColorTaxonomy: value } )
							}
						/>
						<TextareaControl
							label={ __( 'Color rules', 'inblock-map-block' ) }
							help={ __(
								'One rule per line: term-slug=#RRGGBB',
								'inblock-map-block'
							) }
							value={ attributes.proMarkerColorRules || '' }
							onChange={ ( value ) =>
								setAttributes( { proMarkerColorRules: value } )
							}
						/>
					</PanelBody>
				</InspectorControls>
			</Fragment>
		);
	},
	'withInblockMapBlockPremiumControls'
);

addFilter(
	'editor.BlockEdit',
	'inblock-map-block/pro-controls',
	withPremiumControls
);
