'use strict';

const path = require( 'path' );
const { SchemaFactory, ZObjectKeyFactory } = require( '../../src/schema.js' );
const { readYaml } = require( '../../src/fileUtils.js' );
const { testValidation } = require( '../testUtils.js' );

QUnit.module( 'NORMAL_USER_DEFINED' );

const factory = SchemaFactory.NORMAL();

function test( ZID ) {
	const normalize = require( '../../src/normalize.js' );
	const normalFile = path.join( 'test_data', 'normal_user_defined', ZID + '.yaml' );
	const testDescriptor = readYaml( normalFile );
	// See T304144 re: the withVoid arg of normalize, and the impact of setting it to true
	const testZ4 = normalize( testDescriptor.test_Z4,
		/* generically= */ true, /* withVoid= */ true, /* fromBenjamin= */ true ).Z22K1;
	const normalValidatorMap = factory.createUserDefined( [ testZ4 ], /* benjamin= */ true );
	const genericKey = ZObjectKeyFactory.create( testZ4, /* benjamin= */ true ).asString();
	const normalValidator = normalValidatorMap.get( genericKey );
	const info = testDescriptor.test_information;
	testValidation( info.name, normalValidator, testDescriptor.test_objects );
}

test( 'Z10001' );
