'use strict';

const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { readYaml } = require( '../../src/fileUtils.js' );
const { testValidation } = require( '../testUtils.js' );

QUnit.module( 'NORMAL' );

const factory = SchemaFactory.NORMAL();

function test( ZID ) {
	const normalValidator = factory.create( ZID );
	const normalFile = path.join( 'test_data', 'normal_zobject', ZID + '.yaml' );
	const testDescriptor = readYaml( normalFile );
	const info = testDescriptor.test_information;
	testValidation( info.name, normalValidator, testDescriptor.test_objects );
}

test( 'GENERIC' );
test( 'Z1' );
test( 'Z2' );
test( 'Z4' );
test( 'Z7' );
test( 'Z7_backend' );
test( 'Z10' );
test( 'Z14' );
test( 'Z17' );
test( 'Z18' );
test( 'Z22' );
test( 'Z39' );
test( 'Z40' );
test( 'Z61' );
test( 'Z80' );
test( 'Z86' );
test( 'Z99' );
