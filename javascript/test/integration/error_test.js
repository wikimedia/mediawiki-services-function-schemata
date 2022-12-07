'use strict';

const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { readYaml } = require( '../../src/fileUtils.js' );
const { testErrors } = require( '../testUtils.js' );

const normalFactory = SchemaFactory.NORMAL();
const canonicalFactory = SchemaFactory.CANONICAL();

function testValidateNormal( ZID ) {
	const normalValidator = normalFactory.create( ZID );
	const errorValidator = normalFactory.create( 'Z5' );
	const normalFile = path.join( 'test_data', 'errors', 'normal_' + ZID + '.yaml' );
	const testDescriptor = readYaml( normalFile );
	const info = testDescriptor.test_information;
	testErrors( info.name, normalValidator, testDescriptor.test_objects, errorValidator );
}

function testValidateCanonical( ZID ) {
	const canonicalValidator = canonicalFactory.create( ZID );
	// Errors are built in normal form
	const errorValidator = normalFactory.create( 'Z5' );
	const canonicalFile = path.join( 'test_data', 'errors', 'canonical_' + ZID + '.yaml' );
	const testDescriptor = readYaml( canonicalFile );
	const info = testDescriptor.test_information;
	testErrors( info.name, canonicalValidator, testDescriptor.test_objects, errorValidator );
}

QUnit.module( 'ERRORS', () => {
	testValidateNormal( 'Z2' );
	testValidateCanonical( 'Z2' );
} );
