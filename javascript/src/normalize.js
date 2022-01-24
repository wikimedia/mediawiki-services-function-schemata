'use strict';

/* eslint no-use-before-define: ["error", { "functions": false }] */

const { error } = require( './error.js' );
const { arrayToZ10, convertArrayToZList, isArray, isReference, isString, makeResultEnvelope } = require( './utils.js' );
const { SchemaFactory } = require( './schema' );

const mixedFactory = SchemaFactory.MIXED();
// Canonical form syntax is a superset of normal form syntax, so this validator
// captures mixed forms.
const mixedZ1Validator = mixedFactory.create( 'Z1' );

// the input is assumed to be a well-formed ZObject, or else the behaviour is undefined
function normalize( o, generically ) {
	const partialNormalize = ( ZObject ) => normalize( ZObject, generically );
	if ( isString( o ) ) {
		// TODO: should be revisited when we dedice on a good way to distinguish Z9 from Z6
		if ( isReference( o ) ) {
			return { Z1K1: 'Z9', Z9K1: o };
		} else {
			return { Z1K1: 'Z6', Z6K1: o };
		}
	}

	if ( isArray( o ) ) {
		let arrayFunction;
		if ( generically ) {
			arrayFunction = convertArrayToZList;
		} else {
			arrayFunction = arrayToZ10;
		}
		return arrayFunction( o.map( partialNormalize ) );
	}

	if ( o.Z1K1 === 'Z5' &&
		( o.Z5K1.Z1K1 === error.syntax_error || o.Z5K1.Z1K1 === error.not_wellformed ) ) {
		return o;
	}

	const keys = Object.keys( o );
	const result = {};
	for ( let i = 0; i < keys.length; i++ ) {
		if ( keys[ i ] === 'Z1K1' && ( o.Z1K1 === 'Z6' || o.Z1K1 === 'Z9' ) ) {
			result.Z1K1 = o.Z1K1;
			continue;
		}
		if ( keys[ i ] === 'Z6K1' && isString( o.Z6K1 ) ) {
			result.Z6K1 = o.Z6K1;
			continue;
		}
		if ( keys[ i ] === 'Z9K1' && isString( o.Z9K1 ) ) {
			result.Z9K1 = o.Z9K1;
			continue;
		}
		if ( keys[ i ] === 'Z10K1' && !keys.includes( 'Z10K2' ) ) {
			result.Z10K2 = partialNormalize( [] );
		}
		result[ keys[ i ] ] = partialNormalize( o[ keys[ i ] ] );
	}
	return result;
}

/**
 * Normalizes a canonical ZObject. Returns the normalized ZObject or a
 * Z5/Error in a Z22/Pair.
 *
 * @param {Object} o a ZObject
 * @param {boolean} generically whether to produce generic lists (Z10s if false)
 * @return {Object} a Z22
 */
function normalizeExport( o, generically = false ) {
	const status = mixedZ1Validator.validateStatus( o );

	if ( status.isValid() ) {
		return makeResultEnvelope( normalize( o, generically ), null );
	} else {
		return makeResultEnvelope( null, status.getZ5() );
	}
}

module.exports = normalizeExport;
