'use strict';

/* eslint no-use-before-define: ["error", { "functions": false }] */

const { error } = require( './error.js' );
const { arrayToZ10, convertArrayToZList, isArray, isReference, isString,
	makeResultEnvelope, makeMappedResultEnvelope } = require( './utils.js' );
const { SchemaFactory } = require( './schema' );

const mixedFactory = SchemaFactory.MIXED();
// Canonical form syntax is a superset of normal form syntax, so this validator
// captures mixed forms.
const mixedZ1Validator = mixedFactory.create( 'Z1' );

// the input is assumed to be a well-formed ZObject, or else the behaviour is undefined
async function normalize( o, generically, benjamin ) {
	const partialNormalize = async ( ZObject ) => await normalize( ZObject, generically, benjamin );
	if ( isString( o ) ) {
		if ( isReference( o ) ) {
			return { Z1K1: 'Z9', Z9K1: o };
		} else {
			return { Z1K1: 'Z6', Z6K1: o };
		}
	}

	// If generic = true, converts to generic list
	// If benjamin = true, interprets array as benjamin array
	// TODO (T292788): To remove support for Z10K1, remove behavior for
	// generic=false and benjamin=false
	if ( isArray( o ) ) {
		if ( generically ) {
			return await convertArrayToZList(
				await Promise.all( o.map( partialNormalize ) ), false, benjamin
			);
		} else {
			return await arrayToZ10( await Promise.all( o.map( partialNormalize ) ) );
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
		if ( keys[ i ] === 'Z10K1' && !keys.includes( 'Z10K2' ) ) {
			result.Z10K2 = await partialNormalize( [] );
		}
		result[ keys[ i ] ] = await partialNormalize( o[ keys[ i ] ] );
	}
	return result;
}

/**
 * Normalizes a canonical ZObject. Returns the normalized ZObject or a
 * Z5/Error in a Z22/Pair.  The withVoid argument supports our transition
 * from Z23 to Z24 for the non-contentful portion of the envelope, AND
 * our transition from basic Z22 envelopes to map-based envelopes.  With
 * withVoid = true, BOTH Z24 and map-based envelopes will be used.
 * The fromBenjamin argument supports our transition from simple arrays to
 * benjamin arrays. If called with fromBenjamin = false, the arrays found
 * in the input ZObject are understood to be simple arrays, and their type
 * is inferred from the items. Else, the input arrays are benjamin arrays
 * and their first element is the list type declaration.
 *
 * @param {Object} o a ZObject
 * @param {boolean} generically whether to produce generic lists (Z10s if false)
 * @param {boolean} withVoid If true, use Z24/void and map-based Z22
 * @param {boolean} fromBenjamin If true, assume input has benjamin arrays,
 * else infer type from simple arrays
 * @return {Object} a Z22 / Evaluation result
 */
async function normalizeExport( o, generically = true, withVoid = false, fromBenjamin = false ) {
	const status = await mixedZ1Validator.validateStatus( o );
	let functor;
	if ( withVoid ) {
		functor = makeMappedResultEnvelope;
	} else {
		functor = makeResultEnvelope;
	}

	if ( status.isValid() ) {
		return functor( await normalize( o, generically, fromBenjamin ), null );
	} else {
		return functor( null, status.getZ5() );
	}
}

module.exports = normalizeExport;
