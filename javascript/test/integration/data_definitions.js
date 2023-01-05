'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { inferType } = require( '../../src/utils.js' );
const { dataDir } = require( '../../src/fileUtils.js' );

QUnit.module( 'data_definitions' );

const dataPath = dataDir( 'definitions' );
const naturalLanguages = dataDir( 'definitions/naturalLanguages.json' );
const softwareLanguages = dataDir( 'definitions/softwareLanguages.json' );
const badPersistent = path.join( 'test_data', 'bad_definitions', 'bad_persistent' );
const badInner = path.join( 'test_data', 'bad_definitions', 'bad_inner' );

const factory = SchemaFactory.CANONICAL();
const validator = factory.create( 'Z2' );

function testDataWellformedness( ZID, object, isValidZ2, isValidInner, description ) {
	const name = ZID + ' ZPersistentObject: ' + description;

	// Validate Z2
	QUnit.test( name, ( assert ) => {
		const status = validator.validateStatus( object );
		assert.strictEqual( status.isValid(), isValidZ2 );
	} );

	// Validate inner ZObject if validator is available
	const innerObject = object.Z2K2;
	const innerType = inferType( innerObject );
	const innerValidator = factory.create( innerType );
	if ( innerValidator ) {
		const innerName = ZID + ' Inner ZObject: ' + description;
		QUnit.test( innerName, ( assert ) => {
			const innerStatus = innerValidator.validateStatus( innerObject );
			assert.strictEqual( innerStatus.isValid(), isValidInner );
		} );
	} else {
		// If the validator is not available, the test should not fail
		console.log( 'Validator not found for inner type: ' + innerType, object );
	}
}

function testForFilesInDirectory( directory, isValidZ2, isValidInner, description ) {
	for ( const file of fs.readdirSync( directory ) ) {
		const ZID = file.split( '.' )[ 0 ];
		const fileRegex = /(Z[1-9]\d*)\.json/;

		if ( file.match( fileRegex ) === null ) {
			return;
		}

		// Validate ZID isn't reserved for testing
		QUnit.test( ZID, ( assert ) => {
			const numericZID = Number( String( ZID ).slice( 1 ) );
			assert.true( numericZID < 400 || numericZID > 499, 'The ZID range Z400 to Z499 is reserved for test objects!' );
		} );

		const jsonFile = fs.readFileSync( path.join( directory, file ), { encoding: 'utf8' } );
		const object = JSON.parse( jsonFile );
		testDataWellformedness( ZID, object, isValidZ2, isValidInner, description );
	}
}

function testNaturalLanguagesParsing( directory, languages ) {
	const languageMapping = {};

	const allNaturalLanguageZObjects = getAllZObjectsInRange( directory, 1001, 1999 );

	for ( const index in allNaturalLanguageZObjects ) {
		const isoCodes = [];
		const languageObject = allNaturalLanguageZObjects[ index ];

		isoCodes.push( languageObject.Z2K2.Z60K1 );
		if ( 'Z60K2' in languageObject.Z2K2 ) {
			const aliases = languageObject.Z2K2.Z60K2.slice( 1 );
			for ( const alias in aliases ) {
				isoCodes.push( aliases[ alias ] );
			}
		}
		const zid = languageObject.Z2K1.Z6K1;

		for ( const code in isoCodes ) {
			languageMapping[ isoCodes[ code ] ] = zid;
		}
	}

	const expected = JSON.parse( fs.readFileSync( languages, { encoding: 'utf8' } ) );

	QUnit.test( 'validateNaturalLanguageParsing', ( assert ) => {
		assert.deepEqual( languageMapping, expected );
	} );
}

function testSoftwareLanguagesParsing( directory, languages ) {
	const languageMapping = {};
	const allSoftwareLanguageZObjects = getAllZObjectsInRange( directory, 600, 699 );

	for ( const index in allSoftwareLanguageZObjects ) {
		const languageObject = allSoftwareLanguageZObjects[ index ];
		languageMapping[ languageObject.Z2K2.Z61K1 ] = languageObject.Z2K1.Z6K1;
	}

	const expected = JSON.parse( fs.readFileSync( languages, { encoding: 'utf8' } ) );

	QUnit.test( 'validateSoftwareLanguageParsing', ( assert ) => {
		assert.deepEqual( languageMapping, expected );
	} );
}

function getAllZObjectsInRange( directory, lowerZid, upperZid ) {
	const allFiles = [];

	for ( const file of fs.readdirSync( directory ) ) {
		const ZID = file.split( '.' )[ 0 ];
		const ZidNumber = parseInt( ZID.slice( 1 ) );
		if ( ZidNumber >= lowerZid && ZidNumber <= upperZid ) {
			const jsonFile = fs.readFileSync( path.join( directory, file ), { encoding: 'utf8' } );
			allFiles.push( JSON.parse( jsonFile ) );
		}
	}

	return allFiles;
}

// Test wellformedness of files in data/definitions directory
{
	testForFilesInDirectory( dataPath, true, true, 'ZObject is fully wellformed.' );
}

// Test failure of test files in test_data/bad_definitions/bad_persistent directory
{
	testForFilesInDirectory( badPersistent, false, true, 'ZPersistentObject is not wellformed.' );
}

// Test failure of test files in test_data/bad_definitions/bad_inner directory
{
	testForFilesInDirectory( badInner, true, false, 'Inner ZObject is not wellformed.' );
}

{
	testNaturalLanguagesParsing( dataPath, naturalLanguages );
}

{
	testSoftwareLanguagesParsing( dataPath, softwareLanguages );
}
