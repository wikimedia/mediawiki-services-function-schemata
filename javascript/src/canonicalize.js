'use strict';

/* eslint no-use-before-define: ["error", { "functions": false }] */

const { convertZListToArray, isArray, isReference, isString, makeMappedResultEnvelope,
	makeResultEnvelope } = require( './utils.js' );
const { SchemaFactory, ZObjectKeyFactory } = require( './schema' );
const normalize = require( './normalize.js' );
const { getError } = require( './utils' );

const normalFactory = SchemaFactory.NORMAL();
const normalZ1Validator = normalFactory.create( 'Z1' );
const Z5Validator = normalFactory.create( 'Z5_literal' );
const Z6Validator = normalFactory.create( 'Z6_literal' );
const Z9Validator = normalFactory.create( 'Z9' );
const Z10Validator = normalFactory.create( 'Z10_literal' );
const Z18Validator = normalFactory.create( 'Z18' );

async function canonicalizeArray( a ) {
	return await Promise.all( a.map( canonicalize ) );
}

async function canonicalizeObject( o ) {
	if ( await Z9Validator.validate( o ) ) {
		o.Z9K1 = await canonicalize( o.Z9K1 );

		// return as string if Z9K1 is a valid reference string
		if ( isString( o.Z9K1 ) && isReference( o.Z9K1 ) ) {
			return o.Z9K1;
		}
	}

	// T295850 Explicitly ignore if the object is an argument declaration (Z18)
	const isArgDeclaration = await Z18Validator.validate( o );

	if ( await Z6Validator.validate( o ) ) {
		o.Z6K1 = await canonicalize( o.Z6K1 );

		// return as string if Z6/String doesn't need to be escaped, i.e., is not in Zxxxx format
		if ( isString( o.Z6K1 ) && !isReference( o.Z6K1 ) ) {
			return o.Z6K1;
		}
	}

	const typeKey = ( await ZObjectKeyFactory.create( o.Z1K1 ) );
	if (
		( await Z10Validator.validate( o ) || typeKey.ZID_ === 'Z881' ) &&
        !isArgDeclaration ) {
		return await Promise.all( convertZListToArray( o ).map( canonicalize ) );
	}

	const keys = Object.keys( o );
	const result = {};

	for ( let i = 0; i < keys.length; i++ ) {
		result[ keys[ i ] ] = await canonicalize( o[ keys[ i ] ] );
	}
	return result;
}

// the input is assumed to be a well-formed ZObject, or else the behaviour is undefined
async function canonicalize( o ) {
	if ( isString( o ) ) {

		return o;
	}

	if ( isArray( o ) ) {
		return await canonicalizeArray( o );
	}

	return await canonicalizeObject( o );
}

/**
 * Canonicalizes a normalized ZObject. Returns either the canonicalized
 * ZObject or a Z5/Error.  The withVoid argument supports our transition
 * from Z23 to Z24 for the non-contentful portion of the envelope, AND
 * our transition from basic Z22 envelopes to map-based envelopes.  With
 * withVoid = true, BOTH Z24 and map-based envelopes will be used.
 *
 * @param {Object} o a ZObject
 * @param {boolean} withVoid If true, use Z24/void and map-based Z22
 * @return {Array} an array of [data, error]
 */
async function canonicalizeExport( o, withVoid = false ) {
	const normalized = await normalize( o, /* generically= */false, withVoid );

	const possibleError = getError( normalized );
	if ( ( await Z5Validator.validateStatus( possibleError ) ).isValid() ) {
		// forward the error that happened in preliminary normalization
		return normalized;
	}

	const status = await normalZ1Validator.validateStatus( normalized );

	let functor;
	if ( withVoid ) {
		functor = makeMappedResultEnvelope;
	} else {
		functor = makeResultEnvelope;
	}

	if ( status.isValid() ) {
		return functor( await canonicalize( normalized.Z22K1 ), null );
	} else {
		return functor( null, status.getZ5() );
	}
}

module.exports = canonicalizeExport;
