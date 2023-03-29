'use strict';

const avro = require( 'avro-js' );
const { dataDir, readJSON } = require( './fileUtils.js' );
const semver = require( 'semver' );
const { validatesAsQuote, validatesAsReference, validatesAsString } = require( './schema.js' );

const Z1_SCHEMA_ = readJSON( dataDir( 'avro', 'Z1.avsc' ) );
const Z6_SCHEMA_ = readJSON( dataDir( 'avro', 'Z6.avsc' ) );
const Z9_SCHEMA_ = readJSON( dataDir( 'avro', 'Z9.avsc' ) );
const Z99_SCHEMA_ = readJSON( dataDir( 'avro', 'Z99.avsc' ) );

// A ZObject is the union of arbitrary Z1s, Z6s, and Z9s.
// Note that Z1_SCHEMA_ must go last because it references the others by name.
const Z1_UNION_ = [ Z6_SCHEMA_, Z9_SCHEMA_, Z99_SCHEMA_, Z1_SCHEMA_ ];
// semver 0.0.1
const avroSchema = avro.parse( Z1_UNION_ );

// Requests in v0.0.2 also indicate whether to use reentrance.
const V002_REQUEST_SCHEMA_ = {
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
// semver 0.0.2
const zobjectSchemaV002 = avro.parse( V002_REQUEST_SCHEMA_ );

// Requests in v0.0.3 rely on a minimal set of information instead of an entire
// Z7, allowing for further compression and facilitating later extension.
const V003_REQUEST_SCHEMA_ = {
	type: 'record',
	namespace: 'ztypes',
	name: 'ZOBJECT',
	fields: [
		{
			name: 'reentrant',
			type: 'boolean'
		},
		{
			name: 'codingLanguage',
			type: 'string'
		},
		{
			name: 'codeString',
			type: 'string'
		},
		{
			name: 'functionName',
			type: 'string'
		},
		{
			name: 'functionArguments',
			type: {
				type: 'map',
				values: Z1_UNION_
			}
		}
	]
};
// semver 0.0.3
const requestSchemaV003 = avro.parse( V003_REQUEST_SCHEMA_ );

// Requests in v0.0.4 rely on a minimal set of information instead of an entire
// Z7, allowing for further compression and facilitating later extension.
const V004_REQUEST_SCHEMA_ = {
	type: 'record',
	namespace: 'ztypes',
	name: 'ZOBJECT',
	fields: [
		{
			name: 'reentrant',
			type: 'boolean'
		},
		{
			name: 'remainingTime',
			type: 'double'
		},
		{
			name: 'codingLanguage',
			type: 'string'
		},
		{
			name: 'codeString',
			type: 'string'
		},
		{
			name: 'functionName',
			type: 'string'
		},
		{
			name: 'functionArguments',
			type: {
				type: 'map',
				values: Z1_UNION_
			}
		}
	]
};
// semver 0.0.4
const requestSchemaV004 = avro.parse( V004_REQUEST_SCHEMA_ );

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

function convertRequestToBinaryV004( ZObject ) {
	const toSerialize = {
		reentrant: ZObject.reentrant,
		functionArguments: {}
	};

	// This is the only difference between semver v0.0.3 and v0.0.4.
	if ( ZObject.remainingTime !== null ) {
		toSerialize.remainingTime = ZObject.remainingTime;
	}
	const actualObject = ZObject.zobject;
	for ( const key of Object.keys( actualObject ) ) {
		if ( key === 'Z1K1' ) {
			continue;
		}
		const value = actualObject[ key ];
		if ( key === 'Z7K1' ) {
			toSerialize.functionName = value.Z8K5.Z9K1;
			const firstImplementation = value.Z8K4.K1;
			toSerialize.codingLanguage = firstImplementation.Z14K3.Z16K1.Z61K1.Z6K1;
			toSerialize.codeString = firstImplementation.Z14K3.Z16K2.Z6K1;
			continue;
		}
		toSerialize.functionArguments[ key ] = formatNormalForSerialization( value );
	}
	return toSerialize;
}

function convertZObjectToBinary( ZObject, version = '0.0.1' ) {
	if ( semver.gte( version, '0.0.3' ) ) {
		const toSerialize = convertRequestToBinaryV004( ZObject );
		if ( semver.gte( version, '0.0.4' ) ) {
			return requestSchemaV004.toBuffer( toSerialize );
		}
		return requestSchemaV003.toBuffer( toSerialize );
	} else if ( semver.gte( version, '0.0.2' ) ) {
		return zobjectSchemaV002.toBuffer( {
			reentrant: ZObject.reentrant,
			zobject: formatNormalForSerialization( ZObject.zobject )
		} );
	} else {
		return avroSchema.toBuffer( formatNormalForSerialization( ZObject ) );
	}
}

function recoverRequestFromAvroFormat3Or4( recovered ) {
	// Copy all members so that the result loses the ZOBJECT type annotation.
	const result = { ...recovered };
	for ( const key of Object.keys( recovered.functionArguments ) ) {
		const argument = recovered.functionArguments[ key ];
		result.functionArguments[ key ] = recoverNormalFromSerialization( argument );
	}
	return result;
}

function getZObjectFromBinary( buffer, version = '0.0.1' ) {
	if ( semver.gte( version, '0.0.3' ) ) {
		let recovered;
		if ( semver.gte( version, '0.0.4' ) ) {
			recovered = requestSchemaV004.fromBuffer( buffer );
		} else {
			recovered = requestSchemaV003.fromBuffer( buffer );
		}
		return recoverRequestFromAvroFormat3Or4( recovered );
	} else if ( semver.gte( version, '0.0.2' ) ) {
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
