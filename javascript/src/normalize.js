'use strict';

/* eslint no-use-before-define: ["error", { "functions": false }] */

const { error } = require( './error.js' );
const { convertBenjaminArrayToZList, convertItemArrayToZList, isArray, isReference, isString,
	makeMappedResultEnvelope } = require( './utils.js' );
const { SchemaFactory } = require( './schema' );

const mixedFactory = SchemaFactory.MIXED();
// Canonical form syntax is a superset of normal form syntax, so this validator
// captures mixed forms.
const mixedZ1Validator = mixedFactory.create( 'Z1' );

// the input is assumed to be a well-formed ZObject, or else the behaviour is undefined
function normalize( o, generically, benjamin ) {
	const partialNormalize = ( ZObject ) => normalize( ZObject, generically, benjamin );
	if ( isString( o ) ) {
		if ( isReference( o ) ) {
			return { Z1K1: 'Z9', Z9K1: o };
		} else {
			return { Z1K1: 'Z6', Z6K1: o };
		}
	}

	// If benjamin = true, interprets array as benjamin array
	if ( isArray( o ) ) {
		if ( benjamin ) {
			return convertBenjaminArrayToZList( o.map( partialNormalize ), false );
		} else {
			return convertItemArrayToZList( o.map( partialNormalize ), false );
		}
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
		result[ keys[ i ] ] = partialNormalize( o[ keys[ i ] ] );
	}
	return result;
}

/**
 * Normalizes a canonical ZObject. Returns the normalized ZObject or a
 * Z5/Error in a Z22/Pair.
 *
 * If called with fromBenjamin = false, the arrays found
 * in the input ZObject are understood to be simple arrays, and their type
 * is inferred from the items. Else, the input arrays are benjamin arrays
 * and their first element is the list type declaration.
 *
 * @param {Object} o a ZObject
 * @param {boolean} generically whether to produce generic lists (Z10s if false)
 * @param {boolean} withVoid Ignored deprecated flag.
 * @param {boolean} fromBenjamin If true, assume input has benjamin arrays,
 * else infer type from simple arrays
 * @return {Object} a Z22 / Evaluation result
 */
// eslint-disable-next-line no-unused-vars
function normalizeExport( o, generically = true, withVoid = false, fromBenjamin = true ) {
	const status = mixedZ1Validator.validateStatus( o );

	if ( status.isValid() ) {
		return makeMappedResultEnvelope( normalize( o, generically, fromBenjamin ), null );
	} else {
		return makeMappedResultEnvelope( null, status.getZ5() );
	}
}

module.exports = normalizeExport;
