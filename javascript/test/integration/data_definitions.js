'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { dataDir } = require( '../../src/utils.js' );

QUnit.module( 'data_definitions' );

const dataPath = dataDir( 'definitions' );
const factory = SchemaFactory.CANONICAL();
const validator = factory.create( 'Z2' );

function testDataWellformedness( ZID, object ) {
	const name = ZID + ': Wellformedness of data definition.';

	QUnit.test( name, ( assert ) => {
		const status = validator.validateStatus( object );
		assert.true( status.isValid() );
	} );
}

fs.readdirSync( dataPath ).forEach( ( file ) => {
	const ZID = file.split( '.' )[ 0 ];
	const fileRegex = /(Z[1-9]\d*)\.json/;

	if ( file.match( fileRegex ) === null ) {
		return;
	}

	const jsonFile = fs.readFileSync( path.join( dataPath, file ), { encoding: 'utf8' } );
	const object = JSON.parse( jsonFile );
	testDataWellformedness( ZID, object );
} );
