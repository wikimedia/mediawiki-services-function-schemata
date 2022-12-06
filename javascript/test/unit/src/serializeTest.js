'use strict';

const path = require( 'path' );
const { convertWrappedZObjectToVersionedBinary, convertZObjectToBinary, getWrappedZObjectFromVersionedBinary, getZObjectFromBinary, recoverNormalFromSerialization } = require( '../../../src/serialize.js' );
const { readJSON } = require( '../../../src/fileUtils.js' );

QUnit.module( 'serialization' );

const hugeFunctionCall = readJSON( path.join( 'test_data', 'function_call', 'too_big.json' ) );

// Sense check: serialized version should be smaller than the original object.
QUnit.test( 'binaries should be small', ( assert ) => {
	const serialized = convertZObjectToBinary( hugeFunctionCall );
	const compressedSize = serialized.length;
	const uncompressedSize = JSON.stringify( hugeFunctionCall ).length;
	// For objects of this size, we should achieve more than 2.5x compression.
	assert.true( compressedSize * 2.5 < uncompressedSize );
} );

// Idempotence check: serialization then deserialization should produce the
// original object.
QUnit.test( 'serialization 0.0.1 should be invertible', ( assert ) => {
	const serialized = convertZObjectToBinary( hugeFunctionCall );
	const deserialized = getZObjectFromBinary( serialized );
	assert.deepEqual( deserialized, hugeFunctionCall );
} );

QUnit.test( 'recoverNormalFromSerialization should throw error on bad input', ( assert ) => {
	const degenerate = { 'ztypes.Z2': 'impossible' };
	assert.throws( () => {
		recoverNormalFromSerialization( degenerate );
	} );
} );

QUnit.test( 'serialization 0.0.2 should be invertible', ( assert ) => {
	const original = {
		reentrant: true,
		zobject: hugeFunctionCall
	};
	const serialized = convertZObjectToBinary( original, '0.0.2' );
	const deserialized = getZObjectFromBinary( serialized, '0.0.2' );
	assert.deepEqual( deserialized, original );
} );

QUnit.test( 'wrapped serialization should be invertible with version 0.0.1', ( assert ) => {
	const original = hugeFunctionCall;
	const serialized = convertWrappedZObjectToVersionedBinary( original, '0.0.1' );
	const deserialized = getWrappedZObjectFromVersionedBinary( serialized );
	assert.deepEqual( deserialized, original );
} );

QUnit.test( 'wrapped serialization should be invertible with version 0.0.2', ( assert ) => {
	const original = {
		reentrant: true,
		zobject: hugeFunctionCall
	};
	const serialized = convertWrappedZObjectToVersionedBinary( original, '0.0.2' );
	const deserialized = getWrappedZObjectFromVersionedBinary( serialized );
	assert.deepEqual( deserialized, original );
} );

QUnit.test( 'serialization 0.0.3', ( assert ) => {
	const bigFunctionCall = readJSON( path.join( 'test_data', 'function_call', 'decently_big.json' ) );
	const original = {
		reentrant: true,
		zobject: bigFunctionCall
	};
	const serialized = convertWrappedZObjectToVersionedBinary( original, '0.0.3' );
	const deserialized = getWrappedZObjectFromVersionedBinary( serialized );
	const expected = {
		reentrant: true,
		codingLanguage: 'python-3',
		codeString: 'def Z1802(Z1802K1, Z1802K2):\n    return {Z1802K2: str(Z1802K1[Z1802K2])}',
		functionName: 'Z1802',
		functionArguments: {
			Z1802K1: {
				Z1K1: 'Z6',
				Z6K1: 'true?'
			}
		}
	};

	assert.deepEqual( deserialized, expected );
} );
