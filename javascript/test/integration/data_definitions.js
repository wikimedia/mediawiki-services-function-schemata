'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { inferType } = require( '../../src/utils.js' );
const { dataDir } = require( '../../src/fileUtils.js' );

QUnit.module( 'data_definitions' );

const dataPath = dataDir( 'definitions' );
const badPersistent = path.join( 'test_data', 'bad_definitions', 'bad_persistent' );
const badInner = path.join( 'test_data', 'bad_definitions', 'bad_inner' );

const factory = SchemaFactory.CANONICAL();
const validator = factory.create( 'Z2' );

function testDataWellformedness( ZID, object, isValidZ2, isValidInner, description ) {
	const name = ZID + ' ZPersistentObject: ' + description;

	// Validate Z2
	QUnit.test( name, ( assert ) => {
		const status = validator.validateStatus( object );
		assert.equal( status.isValid(), isValidZ2 );
	} );

	// Validate inner ZObject if validator is available
	const innerObject = object.Z2K2;
	const innerType = inferType( innerObject );
	const innerValidator = factory.create( innerType );
	if ( innerValidator ) {
		const innerName = ZID + ' Inner ZObject: ' + description;
		QUnit.test( innerName, ( assert ) => {
			const innerStatus = innerValidator.validateStatus( innerObject );
			assert.equal( innerStatus.isValid(), isValidInner );
		} );
	} else {
		// If the validator is not available, the test should not fail
		console.log( 'Validator not found for inner type: ' + innerType, object );
	}
}

// Test wellformedness of files in data/definitions directory
fs.readdirSync( dataPath ).forEach( ( file ) => {
	const ZID = file.split( '.' )[ 0 ];
	const fileRegex = /(Z[1-9]\d*)\.json/;

	if ( file.match( fileRegex ) === null ) {
		return;
	}

	const jsonFile = fs.readFileSync( path.join( dataPath, file ), { encoding: 'utf8' } );
	const object = JSON.parse( jsonFile );
	testDataWellformedness( ZID, object, true, true, 'ZObject is fully wellformed.' );
} );

// Test failure of test files in test_data/bad_definitions/bad_persistent directory
fs.readdirSync( badPersistent ).forEach( ( file ) => {
	const ZID = file.split( '.' )[ 0 ];
	const fileRegex = /(Z[1-9]\d*)\.json/;

	if ( file.match( fileRegex ) === null ) {
		return;
	}

	const jsonFile = fs.readFileSync( path.join( badPersistent, file ), { encoding: 'utf8' } );
	const object = JSON.parse( jsonFile );

	testDataWellformedness( ZID, object, false, true, 'ZPersistentObject is not wellformed.' );
} );

// Test failure of test files in test_data/bad_definitions/bad_inner directory
fs.readdirSync( badInner ).forEach( ( file ) => {
	const ZID = file.split( '.' )[ 0 ];
	const fileRegex = /(Z[1-9]\d*)\.json/;

	if ( file.match( fileRegex ) === null ) {
		return;
	}

	const jsonFile = fs.readFileSync( path.join( badInner, file ), { encoding: 'utf8' } );
	const object = JSON.parse( jsonFile );

	testDataWellformedness( ZID, object, true, false, 'Inner ZObject is not wellformed.' );
} );
