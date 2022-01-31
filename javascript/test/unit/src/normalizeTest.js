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

	// eslint-disable-next-line qunit/no-test-expect-argument
	test( info.name, normalize, testDescriptor.test_objects ).then();
}

{
	const testPath = path.join( 'test_data', 'normalization_generic.yaml' );
	const testDescriptor = readYaml( testPath );
	const info = testDescriptor.test_information;
	const normalizeGenerically = ( ZObject ) => normalize( ZObject, /* generically= */true );

	// eslint-disable-next-line qunit/no-test-expect-argument
	test( info.name, normalizeGenerically, testDescriptor.test_objects ).then();
}
