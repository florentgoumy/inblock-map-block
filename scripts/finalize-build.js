const {
	copyFileSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} = require( 'node:fs' );
const { dirname, resolve } = require( 'node:path' );

const source = resolve(
	__dirname,
	'../node_modules/maplibre-gl/dist/maplibre-gl-csp-worker.js'
);
const destination = resolve( __dirname, '../build/maplibre-gl-csp-worker.js' );

mkdirSync( dirname( destination ), { recursive: true } );
copyFileSync( source, destination );

const buildDirectory = resolve( __dirname, '../build' );
for ( const filename of readdirSync( buildDirectory ) ) {
	if ( ! filename.endsWith( '.asset.php' ) ) {
		continue;
	}

	const assetPath = resolve( buildDirectory, filename );
	const contents = readFileSync( assetPath, 'utf8' );
	writeFileSync( assetPath, contents.replace( /[\t ]+$/gm, '' ) );
}
