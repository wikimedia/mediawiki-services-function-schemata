'use strict';

const path = require( 'path' );

const canonicalize = require( '../../../src/canonicalize.js' );
const { readYaml } = require( '../../../src/fileUtils.js' );
const { test } = require( '../../testUtils.js' );

QUnit.module( 'canonicalization' );

{
	const testPath = path.join( 'test_data', 'canonicalization.yaml' );
	const testDescriptor = readYaml( testPath );
	const info = testDescriptor.test_information;

	// See T304144 re: the withVoid arg of canonicalize, and the impact of setting it to true
	const canonicalizeWithVoid = ( ZObject ) => canonicalize(
		ZObject, /* withVoid= */ true, /* toBenjamin= */ true
	);

	// eslint-disable-next-line qunit/no-test-expect-argument
	test( info.name, canonicalizeWithVoid, testDescriptor.test_objects ).then();
}

{
	const testPath = path.join( 'test_data', 'canonicalization_legacy.yaml' );
	const testDescriptor = readYaml( testPath );
	const info = testDescriptor.test_information;

	// See T304144 re: the withVoid arg of canonicalize, and the impact of setting it to true
	const canonicalizeWithVoid = ( ZObject ) => canonicalize(
		ZObject, /* withVoid= */ true, /* toBenjamin= */ false
	);

	// eslint-disable-next-line qunit/no-test-expect-argument
	test( info.name, canonicalizeWithVoid, testDescriptor.test_objects ).then();
}
