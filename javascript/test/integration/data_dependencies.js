'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { dataDir } = require( '../../src/utils.js' );

QUnit.module( 'data_dependencies' );

const dataPath = dataDir( 'definitions' );
const dependenciesFile = fs.readFileSync( path.join( dataPath, 'dependencies.json' ), { encoding: 'utf8' } );
const dependencies = JSON.parse( dependenciesFile );

function testDependenciesAvailable( ZID ) {
	const name = ZID + ': Dependencies are available.';

	QUnit.test( name, ( assert ) => {
		assert.true( ZID in dependencies );
	} );
}

fs.readdirSync( dataPath ).forEach( ( file ) => {
	const ZID = file.split( '.' )[ 0 ];
	const fileRegex = /(Z[1-9]\d*)\.json/;

	if ( file.match( fileRegex ) === null ) {
		return;
	}

	testDependenciesAvailable( ZID );
} );
