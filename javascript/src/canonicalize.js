'use strict';

/* eslint no-use-before-define: ["error", { "functions": false }] */

const { isString, is_array, is_reference, Z10ToArray, makeResultEnvelope } = require( './utils.js' ); // eslint-disable-line camelcase
const { SchemaFactory } = require( './schema' );
const normalize = require( './normalize.js' );

const normalFactory = SchemaFactory.NORMAL();
const normalZ1Validator = normalFactory.create( 'Z1' );
const Z6Validator = normalFactory.create( 'Z6' );
const Z9Validator = normalFactory.create( 'Z9' );
const Z10Validator = normalFactory.create( 'Z10' );

function canonicalizeArray( a ) {
	return a.map( canonicalize );
}

function canonicalizeObject( o ) {
	if ( Z9Validator.validate( o ) ) {
		o.Z9K1 = canonicalize( o.Z9K1 );

		// return as string if Z9K1 is a valid reference string
		if ( isString( o.Z9K1 ) && is_reference( o.Z9K1 ) ) {
			return o.Z9K1;
		}
	}

	if ( Z6Validator.validate( o ) ) {
		o.Z6K1 = canonicalize( o.Z6K1 );

		// return as string if Z6/String doesn't need to be escaped, i.e., is not in Zxxxx format
		if ( isString( o.Z6K1 ) && !is_reference( o.Z6K1 ) ) {
			return o.Z6K1;
		}
	}

	if ( Z10Validator.validate( o ) ) {
		return Z10ToArray( o ).map( canonicalize );
	}

	const keys = Object.keys( o );
	const result = {};

	for ( let i = 0; i < keys.length; i++ ) {
		result[ keys[ i ] ] = canonicalize( o[ keys[ i ] ] );
	}
	return result;
}

// the input is assumed to be a well-formed ZObject, or else the behaviour is undefined
function canonicalize( o ) {
	if ( isString( o ) ) {
		return o;
	}

	if ( is_array( o ) ) {
		return canonicalizeArray( o );
	}

	return canonicalizeObject( o );
}

/**
 * Canonicalizes a normalized ZObject. Returns either the canonicalized
 * ZObject or a Z5/Error.
 *
 * @param {Object} o a ZObject
 * @return {Array} an array of [data, error]
 */
function canonicalizeExport( o ) {
	const normalized = normalize( o );

	// TODO: use an actual validator and have validation errors in normal form (T295677)
	if ( normalized.Z22K2.Z1K1.Z9K1 === 'Z5' ) {
		// forward the error that happened in preliminary normalization
		return normalized;
	}

	const status = normalZ1Validator.validateStatus( normalized );

	if ( status.isValid() ) {
		return makeResultEnvelope( canonicalize( normalized.Z22K1 ), null );
	} else {
		return makeResultEnvelope( null, status.getZ5() );
	}
}

module.exports = canonicalizeExport;
