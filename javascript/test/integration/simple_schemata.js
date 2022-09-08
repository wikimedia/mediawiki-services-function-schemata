'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { readYaml } = require( '../../src/fileUtils.js' );
const { testValidation } = require( '../testUtils.js' );

QUnit.module( 'simple_schemata' );

const directory_ = path.join( 'test_data', 'simple_schemata' );

// Every .yaml file in directory_ contains a validator schema and objects which
// should (or should not) validate against that schema.
for ( const file of fs.readdirSync( directory_ ) ) {
	const fileName = path.join( directory_, file );
	const testDescriptor = readYaml( fileName );
	const info = testDescriptor.test_information;
	const factory = new SchemaFactory();
	const validator = factory.parse( testDescriptor.test_schema.validator );

	if ( info.parse_error ) {
		// When parse_error is true, the schema itself is degenerate, so parse()
		// should return null.
		QUnit.test( info.name, ( assert ) => {
			assert.deepEqual( validator, null );
		} );
	} else {
		// Validator was parsed successfully; test validation of objects.
		testValidation( info.name, validator, testDescriptor.test_objects );
	}
}
