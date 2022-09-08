'use strict';

const path = require( 'path' );

const normalize = require( '../../../src/normalize.js' );
const { readYaml } = require( '../../../src/fileUtils.js' );
const { test } = require( '../../testUtils.js' );

QUnit.module( 'normalization' );

{
	const testPath = path.join( 'test_data', 'normalization.yaml' );
	const testDescriptor = readYaml( testPath );
	const info = testDescriptor.test_information;
	// See T304144 re: the withVoid arg of normalize, and the impact of setting it to true
	const normalizeNonGenerically = ( ZObject ) => normalize( ZObject,
		/* generically= */ true, /* withVoid= */ true, /* fromBenjamin= */ true );

	// eslint-disable-next-line qunit/no-test-expect-argument
	test( info.name, normalizeNonGenerically, testDescriptor.test_objects );
}

{
	const testPath = path.join( 'test_data', 'normalization_legacy.yaml' );
	const testDescriptor = readYaml( testPath );
	const info = testDescriptor.test_information;
	const normalizeBenjamins = ( ZObject ) => normalize( ZObject,
		/* generically= */ true, /* withVoid= */ true, /* fromBenjamin= */ false );

	// eslint-disable-next-line qunit/no-test-expect-argument
	test( info.name, normalizeBenjamins, testDescriptor.test_objects );
}
