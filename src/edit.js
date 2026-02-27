import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
  const { lat, lng, zoom } = attributes;

  return (
    <>
      <InspectorControls>
        <PanelBody title={__('Map settings', 'inblock-map-block')} initialOpen={true}>
          <RangeControl
            label={__('Latitude', 'inblock-map-block')}
            value={lat}
            onChange={(value) => setAttributes({ lat: value })}
            min={-90}
            max={90}
            step={0.0001}
          />
          <RangeControl
            label={__('Longitude', 'inblock-map-block')}
            value={lng}
            onChange={(value) => setAttributes({ lng: value })}
            min={-180}
            max={180}
            step={0.0001}
          />
          <RangeControl
            label={__('Zoom', 'inblock-map-block')}
            value={zoom}
            onChange={(value) => setAttributes({ zoom: value })}
            min={1}
            max={19}
          />
        </PanelBody>
      </InspectorControls>

      <div className="inblock-map-block__placeholder">
        <strong>{__('Inblock Map Block', 'inblock-map-block')}</strong>
        <div>
          {__('Lat', 'inblock-map-block')}: {lat} / {__('Lng', 'inblock-map-block')}: {lng} / {__('Zoom', 'inblock-map-block')}: {zoom}
        </div>
        <p>{__('(Leaflet map integration next)', 'inblock-map-block')}</p>
      </div>
    </>
  );
}
