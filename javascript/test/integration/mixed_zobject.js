'use strict';

const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { readYaml } = require( '../../src/utils.js' );
const { testValidation } = require( '../testUtils.js' );

QUnit.module( 'MIXED' );

const factory = SchemaFactory.MIXED();

function test( ZID ) {
	const mixedValidator = factory.create( ZID );
	const mixedFile = path.join( 'test_data', 'mixed_zobject', ZID + '.yaml' );
	const testDescriptor = readYaml( mixedFile );
	const info = testDescriptor.test_information;
	testValidation( info.name, mixedValidator, testDescriptor.test_objects );
}

test( 'Z1' );
