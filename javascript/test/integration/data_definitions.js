'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { inferType } = require( '../../src/utils.js' );
const { dataDir } = require( '../../src/fileUtils.js' );

QUnit.module( 'data_definitions' );

const dataPath = dataDir( 'definitions' );
const naturalLanguages = dataDir( 'definitions/naturalLanguages.json' );
const badPersistent = path.join( 'test_data', 'bad_definitions', 'bad_persistent' );
const badInner = path.join( 'test_data', 'bad_definitions', 'bad_inner' );

const factory = SchemaFactory.CANONICAL();
const validator = factory.create( 'Z2' );

async function testDataWellformedness( ZID, object, isValidZ2, isValidInner, description ) {
	const name = ZID + ' ZPersistentObject: ' + description;

	// Validate Z2
	QUnit.test( name, async ( assert ) => {
		const status = await validator.validateStatus( object );
		assert.strictEqual( status.isValid(), isValidZ2 );
	} );

	// Validate inner ZObject if validator is available
	const innerObject = object.Z2K2;
	const innerType = inferType( innerObject );
	const innerValidator = await factory.create( innerType );
	if ( innerValidator ) {
		const innerName = ZID + ' Inner ZObject: ' + description;
		QUnit.test( innerName, async ( assert ) => {
			const innerStatus = await innerValidator.validateStatus( innerObject );
			assert.strictEqual( innerStatus.isValid(), isValidInner );
		} );
	} else {
		// If the validator is not available, the test should not fail
		console.log( 'Validator not found for inner type: ' + innerType, object );
	}
}

async function testForFilesInDirectory( directory, isValidZ2, isValidInner, description ) {
	const promises = [];
	for ( const file of fs.readdirSync( directory ) ) {
		const ZID = file.split( '.' )[ 0 ];
		const fileRegex = /(Z[1-9]\d*)\.json/;

		if ( file.match( fileRegex ) === null ) {
			return;
		}

		const jsonFile = fs.readFileSync( path.join( directory, file ), { encoding: 'utf8' } );
		const object = JSON.parse( jsonFile );
		promises.push(
			testDataWellformedness( ZID, object, isValidZ2, isValidInner, description ) );
	}
	await Promise.all( promises );
}

async function testNaturalLanguagesParsing( directory, languages ) {
	const languageMapping = {};
	const allFiles = [];

	for ( const file of fs.readdirSync( directory ) ) {
		const ZID = file.split( '.' )[ 0 ];
		const ZidNumber = parseInt( ZID.slice( 1 ) );
		if ( ZidNumber > 1000 && ZidNumber < 2000 ) {
			const jsonFile = fs.readFileSync( path.join( directory, file ), { encoding: 'utf8' } );
			allFiles.push( JSON.parse( jsonFile ) );
		}
	}

	for ( const index in allFiles ) {
		const isoCodes = [];
		const language = allFiles[ index ];

		isoCodes.push( language.Z2K2.Z60K1 );
		if ( 'Z60K2' in language.Z2K2 ) {
			const aliases = language.Z2K2.Z60K2;
			for ( const alias in aliases ) {
				isoCodes.push( aliases[ alias ] );
			}
		}
		const zid = language.Z2K1.Z6K1;

		for ( const code in isoCodes ) {
			languageMapping[ isoCodes[ code ] ] = zid;
		}
	}

	const expected = JSON.parse( fs.readFileSync( languages, { encoding: 'utf8' } ) );

	QUnit.test( 'validateLanguageParsing', async ( assert ) => {
		assert.deepEqual( languageMapping, expected );
	} );
}

// Test wellformedness of files in data/definitions directory
{
	testForFilesInDirectory( dataPath, true, true, 'ZObject is fully wellformed.' ).then();
}

// Test failure of test files in test_data/bad_definitions/bad_persistent directory
{
	testForFilesInDirectory( badPersistent, false, true, 'ZPersistentObject is not wellformed.' ).then();
}

// Test failure of test files in test_data/bad_definitions/bad_inner directory
{
	testForFilesInDirectory( badInner, true, false, 'Inner ZObject is not wellformed.' ).then();
}

{
	testNaturalLanguagesParsing( dataPath, naturalLanguages ).then();
}
