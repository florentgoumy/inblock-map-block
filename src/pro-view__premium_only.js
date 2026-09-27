function escapeHtml( value ) {
	return String( value ?? '' )
		.replaceAll( '&', '&amp;' )
		.replaceAll( '<', '&lt;' )
		.replaceAll( '>', '&gt;' )
		.replaceAll( '"', '&quot;' )
		.replaceAll( "'", '&#039;' );
}

document.addEventListener( 'inblock-map-block:marker-created', ( event ) => {
	const detail = event.detail || {};
	const marker = detail.marker;
	const point = detail.point || {};

	if ( point.proMarkerColor && typeof marker?.setStyle === 'function' ) {
		marker.setStyle( {
			color: point.proMarkerColor,
			fillColor: point.proMarkerColor,
		} );
	}
} );

document.addEventListener( 'inblock-map-block:before-popup', ( event ) => {
	const detail = event.detail || {};
	const marker = detail.marker;
	const point = detail.point || {};

	if (
		! marker ||
		( ! point.proImage && ! point.proExcerpt && ! point.proMeta )
	) {
		return;
	}

	const title = escapeHtml( point.title || '' );
	const url = escapeHtml( point.url || '' );
	const image = point.proImage
		? '<img class="inblock-map-block__popup-image" src="' +
		  escapeHtml( point.proImage ) +
		  '" alt="" loading="lazy" />'
		: '';
	const excerpt = point.proExcerpt
		? '<p class="inblock-map-block__popup-excerpt">' +
		  escapeHtml( point.proExcerpt ) +
		  '</p>'
		: '';

	let meta = '';
	if ( point.proMeta && typeof point.proMeta === 'object' ) {
		meta =
			'<dl class="inblock-map-block__popup-meta">' +
			Object.entries( point.proMeta )
				.map(
					( [ key, value ] ) =>
						'<div><dt>' +
						escapeHtml( key ) +
						'</dt><dd>' +
						escapeHtml( value ) +
						'</dd></div>'
				)
				.join( '' ) +
			'</dl>';
	}

	const html =
		'<div class="inblock-map-block__popup inblock-map-block__popup--pro">' +
		image +
		( title ? '<strong>' + title + '</strong>' : '' ) +
		excerpt +
		meta +
		( url
			? '<div><a href="' +
			  url +
			  '">' +
			  escapeHtml( 'View details' ) +
			  '</a></div>'
			: '' ) +
		'</div>';

	marker.bindPopup( html );
} );
