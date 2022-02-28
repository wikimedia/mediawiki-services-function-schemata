'use strict';

const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { canonicalError, normalError } = require( '../../src/error.js' );
const { readYaml } = require( '../../src/fileUtils.js' );
const { testErrors } = require( '../testUtils.js' );

QUnit.module( 'Z5' );

const factory = SchemaFactory.NORMAL();

async function test( ZID ) {
	const normalValidator = factory.create( ZID );
	const errorValidator = factory.create( 'Z5' );
	const normalFile = path.join( 'test_data', 'errors', 'normal_' + ZID + '.yaml' );
	const testDescriptor = readYaml( normalFile );
	const info = testDescriptor.test_information;
	await testErrors( info.name, normalValidator, testDescriptor.test_objects, errorValidator );
}

QUnit.test( 'canonicalError', async ( assert ) => {
	const simpleStringError = canonicalError( [ 'Z507' ], [ 'Extra data' ] );
	assert.deepEqual( simpleStringError, { Z1K1: 'Z5', Z5K1: { Z1K1: 'Z507', Z507K1: 'Extra data' } } );

	const doubleStringError = canonicalError( [ 'Z507' ], [ 'Extra data', 'More extra data' ] );
	assert.deepEqual( doubleStringError, { Z1K1: 'Z5', Z5K1: { Z1K1: 'Z507', Z507K1: 'Extra data', Z507K2: 'More extra data' } } );

	const nestedStringError = canonicalError( [ 'Z507', 'Z509' ], [ 'Extra data' ] );
	assert.deepEqual( nestedStringError, { Z1K1: 'Z5', Z5K1: { Z1K1: 'Z507', Z507K1: { Z1K1: 'Z509', Z509K1: 'Extra data' } } } );
} );

QUnit.test( 'normalError', async ( assert ) => {
	const simpleStringError = normalError( [ 'Z507' ], [ 'Extra data' ] );
	assert.deepEqual( simpleStringError, { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' }, Z5K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z507' }, Z507K1: { Z1K1: 'Z6', Z6K1: 'Extra data' } } } );

	const doubleStringError = normalError( [ 'Z507' ], [ 'Extra data', 'More extra data' ] );
	assert.deepEqual( doubleStringError, { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' }, Z5K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z507' }, Z507K1: { Z1K1: 'Z6', Z6K1: 'Extra data' }, Z507K2: { Z1K1: 'Z6', Z6K1: 'More extra data' } } } );

	const nestedStringError = normalError( [ 'Z507', 'Z509' ], [ 'Extra data' ] );
	assert.deepEqual( nestedStringError, { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' }, Z5K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z507' }, Z507K1: { Z1K1: 'Z509', Z509K1: { Z1K1: 'Z6', Z6K1: 'Extra data' } } } } );
} );

test( 'Z2' ).then();
