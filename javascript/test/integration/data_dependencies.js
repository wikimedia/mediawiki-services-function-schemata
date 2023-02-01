'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { dataDir } = require( '../../src/fileUtils.js' );

QUnit.module( 'data_dependencies' );

const dataPath = dataDir( 'definitions' );
const dataDirectory = fs.readdirSync( dataPath );
const dependenciesFile = fs.readFileSync( path.join( dataPath, 'dependencies.json' ), { encoding: 'utf8' } );
const dependencies = JSON.parse( dependenciesFile );

function testDependenciesAvailable( ZID ) {
	const name = ZID + ': Dependencies are available.';

	QUnit.test( name, ( assert ) => {
		assert.true( ZID in dependencies );
	} );
}

function generateDependenciesFile( directory ) {

	const filePattern = /^Z\d+\.json$/;
	const refPattern = /"Z(?:1|3|11)K1":\s?"(Z[1-9]\d*)"/g;

	// Note: This must be kept in sync with those types which are provided in PHP form in
	// the WikiLambda MediaWiki extension. See ZTypeRegistry::BUILT_IN_TYPES.
	const typesBuiltIntoWikiLambda = [
		'Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9', 'Z11', 'Z12', 'Z22', 'Z31', 'Z32', 'Z39', 'Z99'
	];

	const initialDataToLoadListing = [];
	for ( const file of fs.readdirSync( directory ) ) {
		if ( filePattern.test( file ) ) {
			initialDataToLoadListing.push( file );
		}
	}

	// Sort, so Z2 gets created before Z10 etc.
	initialDataToLoadListing.sort(
		( a, b ) => {
			return a.localeCompare( b, 'en', { numeric: true }
			);
		}
	);

	const encounteredDependencies = {};

	for ( const filename of initialDataToLoadListing ) {
		const zid = filename.slice( 0, -5 );
		const jsonFile = fs.readFileSync( path.join( directory, filename ), { encoding: 'utf8' } );

		if ( !jsonFile ) {
			// Something went wrong, give up.
			return [];
		}

		const unknownRefs = [];
		// eslint-disable-next-line no-restricted-properties
		const matches = [ ...jsonFile.matchAll( refPattern ) ];

		for ( const match of matches ) {
			const matchedZid = match[ 1 ];
			if (
				// Avoid built-ins
				!typesBuiltIntoWikiLambda.includes( matchedZid ) &&
				// Avoid repetitions
				!unknownRefs.includes( matchedZid ) &&
				// Avoid self-dependency
				( matchedZid !== zid )
			) {
				unknownRefs.push( matchedZid );
			}
		}

		if ( unknownRefs.length > 0 ) {
			encounteredDependencies[ zid ] = unknownRefs;
		}
	}

	return encounteredDependencies;
}

dataDirectory.forEach( ( file ) => {
	const ZID = file.split( '.' )[ 0 ];
	const fileRegex = /(Z[1-9]\d*)\.json/;

	if ( file.match( fileRegex ) === null ) {
		return;
	}

	testDependenciesAvailable( ZID );
} );

QUnit.test( 'Dependencies file is up-to-date', ( assert ) => {
	assert.deepEqual( generateDependenciesFile( dataPath ), dependencies );
} );
