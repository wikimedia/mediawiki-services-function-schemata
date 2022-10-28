'use strict';

const avro = require( 'avro-js' );
const semver = require( 'semver' );
const { validatesAsQuote, validatesAsReference, validatesAsString } = require( './schema.js' );

// TODO (T320217): Read these from .avsc file.
const Z9_SCHEMA_ = {
	type: 'record',
	namespace: 'ztypes',
	name: 'Z9',
	fields: [
		{
			type: 'string',
			name: 'Z9K1'
		}
	]
};

const Z6_SCHEMA_ = {
	type: 'record',
	namespace: 'ztypes',
	name: 'Z6',
	fields: [
		{
			type: 'string',
			name: 'Z6K1'
		}
	]
};

const Z99_SCHEMA_ = {
	type: 'record',
	namespace: 'ztypes',
	name: 'Z99',
	fields: [
		{
			type: 'string',
			name: 'Z99K1'
		}
	]
};

const Z1_SCHEMA_ = {
	type: 'record',
	namespace: 'ztypes',
	name: 'Z1',
	fields: [
		{
			name: 'valueMap',
			type: {
				type: 'map',
				values: [ 'ztypes.Z1', 'ztypes.Z6', 'ztypes.Z9', 'ztypes.Z99' ]
			}
		}
	]
};

// A ZObject is the union of arbitrary Z1s, Z6s, and Z9s.
const Z1_UNION_ = [ Z6_SCHEMA_, Z9_SCHEMA_, Z99_SCHEMA_, Z1_SCHEMA_ ];

const ZOBJECT_SCHEMA_ = {
	type: 'record',
	namespace: 'ztypes',
	name: 'ZOBJECT',
	fields: [
		{
			name: 'reentrant',
			type: 'boolean'
		},
		{
			name: 'zobject',
			type: Z1_UNION_
		}
	]
};

// semver 0.0.1
const avroSchema = avro.parse( Z1_UNION_ );
// semver 0.0.2
const zobjectSchemaV002 = avro.parse( ZOBJECT_SCHEMA_ );

/**
 * Transform a ZObject into the form expected by the serialization schema.
 *
 * @param {Object} ZObject a normal-form ZObject
 * @return {Object} an object in the intermediate serialization format
 */
function formatNormalForSerialization( ZObject ) {
	if ( validatesAsQuote( ZObject ).isValid() ) {
		return { 'ztypes.Z99': { Z99K1: JSON.stringify( ZObject.Z99K1 ) } };
	}
	if ( validatesAsReference( ZObject ).isValid() ) {
		return { 'ztypes.Z9': { Z9K1: ZObject.Z9K1 } };
	}
	if ( validatesAsString( ZObject ).isValid() ) {
		return { 'ztypes.Z6': { Z6K1: ZObject.Z6K1 } };
	}
	const valueMap = {};
	for ( const key of Object.keys( ZObject ) ) {
		valueMap[ key ] = formatNormalForSerialization( ZObject[ key ] );
	}
	return { 'ztypes.Z1': { valueMap: valueMap } };
}

/**
 * Recover a ZObject from the form imposed by the serialization schema.
 *
 * @param {Object} serializedZObject a ZObject in the intermediate serialization format
 * @return {Object} a normal-form ZObject
 */
function recoverNormalFromSerialization( serializedZObject ) {
	const Z1 = serializedZObject[ 'ztypes.Z1' ];
	if ( Z1 !== undefined ) {
		const result = {};
		for ( const key of Object.keys( Z1.valueMap ) ) {
			result[ key ] = recoverNormalFromSerialization( Z1.valueMap[ key ] );
		}
		return result;
	}
	const Z6 = serializedZObject[ 'ztypes.Z6' ];
	if ( Z6 !== undefined ) {
		return { Z1K1: 'Z6', Z6K1: Z6.Z6K1 };
	}
	const Z9 = serializedZObject[ 'ztypes.Z9' ];
	if ( Z9 !== undefined ) {
		return { Z1K1: 'Z9', Z9K1: Z9.Z9K1 };
	}
	const Z99 = serializedZObject[ 'ztypes.Z99' ];
	if ( Z99 !== undefined ) {
		return {
			Z1K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z99'
			},
			Z99K1: JSON.parse( Z99.Z99K1 )
		};
	}
	throw new Error( 'Invalid serialization form; must define one of ztypes.(Z1|Z6|Z9|Z99}' );
}

function convertZObjectToBinary( ZObject, version = '0.0.1' ) {
	if ( semver.gte( version, '0.0.2' ) ) {
		return zobjectSchemaV002.toBuffer( {
			reentrant: ZObject.reentrant,
			zobject: formatNormalForSerialization( ZObject.zobject )
		} );
	} else {
		return avroSchema.toBuffer( formatNormalForSerialization( ZObject ) );
	}
}

function getZObjectFromBinary( buffer, version = '0.0.1' ) {
	if ( semver.gte( version, '0.0.2' ) ) {
		const recovered = zobjectSchemaV002.fromBuffer( buffer );
		return {
			reentrant: recovered.reentrant,
			zobject: recoverNormalFromSerialization( recovered.zobject )
		};
	} else {
		return recoverNormalFromSerialization( avroSchema.fromBuffer( buffer ) );
	}
}

function convertWrappedZObjectToVersionedBinary( wrappedZObject, version ) {
	const serialized = convertZObjectToBinary( wrappedZObject, version );
	const semverBuffer = Buffer.from( version );
	const lengthBuffer = Buffer.from( String.fromCharCode( semverBuffer.length ) );
	return Buffer.concat( [ lengthBuffer, semverBuffer, serialized ] );
}

function getWrappedZObjectFromVersionedBinary( buffer ) {
	const length = buffer.slice( 0, 1 );
	const lengthPivot = 1 + length.toString().charCodeAt( 0 );
	const version = buffer.slice( 1, lengthPivot ).toString();
	const avroSerialized = buffer.slice( lengthPivot, buffer.length );
	return getZObjectFromBinary( avroSerialized, version );
}

module.exports = {
	avroSchema,
	convertWrappedZObjectToVersionedBinary,
	convertZObjectToBinary,
	getWrappedZObjectFromVersionedBinary,
	getZObjectFromBinary,
	formatNormalForSerialization,
	recoverNormalFromSerialization,
	zobjectSchemaV002
};
