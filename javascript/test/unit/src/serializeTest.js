'use strict';

const path = require( 'path' );
const {
	convertWrappedZObjectToVersionedBinary,
	convertZObjectToBinary,
	getWrappedZObjectFromVersionedBinary,
	getZObjectFromBinary,
	formatNormalForSerialization,
	recoverNormalFromSerialization
} = require( '../../../src/serialize.js' );
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

QUnit.test( 'formatNormalForSerialization/recoverNormalFromSerialization: quote', ( assert ) => {
	// FIXME: Why does validatesAsQuote() require normal form but the others require canonical?
	const quote = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z99' }, Z99K1: 'Hello, this is dog' };
	const expected = { 'ztypes.Z99': { Z99K1: '"Hello, this is dog"' } };
	const normalFormQuote = formatNormalForSerialization( quote );
	assert.deepEqual( normalFormQuote, expected );

	const recoveredForm = recoverNormalFromSerialization( normalFormQuote );
	assert.deepEqual( recoveredForm, quote );
} );

QUnit.test( 'formatNormalForSerialization/recoverNormalFromSerialization: reference', ( assert ) => {
	const reference = { Z1K1: 'Z9', Z9K1: 'Z1' };
	const expected = { 'ztypes.Z9': { Z9K1: 'Z1' } };
	const normalFormReference = formatNormalForSerialization( reference );
	assert.deepEqual( normalFormReference, expected );

	const recoveredForm = recoverNormalFromSerialization( normalFormReference );
	assert.deepEqual( recoveredForm, reference );
} );

QUnit.test( 'formatNormalForSerialization/recoverNormalFromSerialization: string', ( assert ) => {
	const string = { Z1K1: 'Z6', Z6K1: 'String value' };
	const expected = { 'ztypes.Z6': { Z6K1: 'String value' } };
	const normalFormString = formatNormalForSerialization( string );
	assert.deepEqual( normalFormString, expected );

	const recoveredForm = recoverNormalFromSerialization( normalFormString );
	assert.deepEqual( recoveredForm, string );
} );

QUnit.test( 'formatNormalForSerialization/recoverNormalFromSerialization: custom type', ( assert ) => {
	const custom = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z400' }, Z400K1: { Z1K1: 'Z6', Z6K1: 'Inner string value' } };
	const expected = { 'ztypes.Z1': { valueMap: {
		Z1K1: { 'ztypes.Z9': { Z9K1: 'Z400' } },
		Z400K1: { 'ztypes.Z6': { Z6K1: 'Inner string value' } }
	} } };
	const normalFormCustom = formatNormalForSerialization( custom );
	assert.deepEqual( normalFormCustom, expected );

	const recoveredForm = recoverNormalFromSerialization( normalFormCustom );
	assert.deepEqual( recoveredForm, custom );
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

QUnit.test( 'serialization 0.0.4', ( assert ) => {
	const bigFunctionCall = readJSON( path.join( 'test_data', 'function_call', 'decently_big.json' ) );
	const e = 2.718281828459;
	const original = {
		reentrant: true,
		zobject: bigFunctionCall,
		remainingTime: e
	};
	const serialized = convertWrappedZObjectToVersionedBinary( original, '0.0.4' );
	const deserialized = getWrappedZObjectFromVersionedBinary( serialized );
	const expected = {
		reentrant: true,
		remainingTime: e,
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
