'use strict';

const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { canonicalError, normalError } = require( '../../src/error.js' );
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

function testCreateCanonical() {
	QUnit.test( 'canonicalError', ( assert ) => {
		const simpleStringError = canonicalError( [ 'Z507' ], [ 'Extra data' ] );
		assert.deepEqual( simpleStringError, { Z1K1: 'Z5', Z5K1: { Z1K1: 'Z507', Z507K1: 'Extra data' } } );

		const doubleStringError = canonicalError( [ 'Z507' ], [ 'Extra data', 'More extra data' ] );
		assert.deepEqual( doubleStringError, { Z1K1: 'Z5', Z5K1: { Z1K1: 'Z507', Z507K1: 'Extra data', Z507K2: 'More extra data' } } );

		const nestedStringError = canonicalError( [ 'Z507', 'Z509' ], [ 'Extra data' ] );
		assert.deepEqual( nestedStringError, { Z1K1: 'Z5', Z5K1: { Z1K1: 'Z507', Z507K1: { Z1K1: 'Z509', Z509K1: 'Extra data' } } } );
	} );
}

function testCreateNormal() {
	QUnit.test( 'normalError', ( assert ) => {
		const simpleStringError = normalError( [ 'Z507' ], [ 'Extra data' ] );
		assert.deepEqual( simpleStringError, { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' }, Z5K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z507' }, Z507K1: { Z1K1: 'Z6', Z6K1: 'Extra data' } } } );

		const doubleStringError = normalError( [ 'Z507' ], [ 'Extra data', 'More extra data' ] );
		assert.deepEqual( doubleStringError, { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' }, Z5K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z507' }, Z507K1: { Z1K1: 'Z6', Z6K1: 'Extra data' }, Z507K2: { Z1K1: 'Z6', Z6K1: 'More extra data' } } } );

		const nestedStringError = normalError( [ 'Z507', 'Z509' ], [ 'Extra data' ] );
		assert.deepEqual( nestedStringError, { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' }, Z5K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z507' }, Z507K1: { Z1K1: 'Z509', Z509K1: { Z1K1: 'Z6', Z6K1: 'Extra data' } } } } );

		const simpleNonStringError = normalError( [ 'Z507' ], [ { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z40' }, Z40K1: { Z1K1: 'Z9', Z9K1: 'Z41' } } ] );
		assert.deepEqual( simpleNonStringError, { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' }, Z5K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z507' }, Z507K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z40' }, Z40K1: { Z1K1: 'Z9', Z9K1: 'Z41' } } } } );
	} );
}

QUnit.module( 'ERRORS', () => {
	testValidateNormal( 'Z2' );
	testValidateCanonical( 'Z2' );
	testCreateNormal();
	testCreateCanonical();
} );
