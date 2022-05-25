'use strict';

/* eslint no-use-before-define: ["error", { "functions": false }] */

const { convertZListToArray, isReference, isString, makeMappedResultEnvelope } = require( './utils.js' );
const { SchemaFactory } = require( './schema' );
const normalize = require( './normalize.js' );
const { getError } = require( './utils' );

const normalFactory = SchemaFactory.NORMAL();
const normalZ1Validator = normalFactory.create( 'Z1' );
const Z5Validator = normalFactory.create( 'Z5_literal' );
const Z6Validator = normalFactory.create( 'Z6_literal' );
const Z7Validator = normalFactory.create( 'Z7_literal' );
const Z9Validator = normalFactory.create( 'Z9_literal' );
const Z10Validator = normalFactory.create( 'Z10_literal' );
const TypedListValidator = normalFactory.create( 'LIST_literal' );

async function canonicalizeObject( o, benjamin ) {
	if ( await Z9Validator.validate( o ) ) {
		o.Z9K1 = await canonicalize( o.Z9K1, benjamin );

		// return as string if Z9K1 is a valid reference string
		if ( isString( o.Z9K1 ) && isReference( o.Z9K1 ) ) {
			return o.Z9K1;
		}
	}

	if ( await Z6Validator.validate( o ) ) {
		o.Z6K1 = await canonicalize( o.Z6K1, benjamin );

		// return as string if Z6/String doesn't need to be escaped, i.e., is not in Zxxxx format
		if ( isString( o.Z6K1 ) && !isReference( o.Z6K1 ) ) {
			return o.Z6K1;
		}
	}

	// TODO (T292788): Remove support for Z10K1.
	if ( await Z10Validator.validate( o ) ) {
		return await Promise.all(
			convertZListToArray( o ).map( ( e ) => canonicalize( e, benjamin ) )
		);
	}

	if ( await TypedListValidator.validate( o ) ) {
		const itemList = await Promise.all(
			convertZListToArray( o ).map( ( e ) => canonicalize( e, benjamin ) )
		);

		if ( benjamin ) {
			let itemType;
			// If type is a function call, item is the content of Z88K1
			if ( await Z7Validator.validate( o.Z1K1 ) ) {
				itemType = await canonicalize( o.Z1K1.Z881K1, benjamin );
			} else {
				itemType = await canonicalize( o.Z1K1, benjamin );
			}
			return [ itemType ].concat( itemList );
		}
		return itemList;
	}

	const keys = Object.keys( o );
	const result = {};

	for ( let i = 0; i < keys.length; i++ ) {
		result[ keys[ i ] ] = await canonicalize( o[ keys[ i ] ], benjamin );
	}
	return result;
}

// the input is assumed to be a well-formed ZObject, or else the behaviour is undefined
async function canonicalize( o, benjamin ) {
	if ( isString( o ) ) {
		return o;
	}
	return await canonicalizeObject( o, benjamin );
}

/**
 * Canonicalizes a normalized ZObject. Returns either the canonicalized
 * ZObject or a Z5/Error.
 *
 * @param {Object} o a ZObject
 * @param {boolean} withVoid Ignored deprecated flag.
 * @param {boolean} toBenjamin If true, canonicalize to benjamin arrays,
 * else to simple arrays
 * @return {Array} an array of [data, error]
 */
async function canonicalizeExport( o, withVoid = false, toBenjamin = false ) {
	const normalized = await normalize( o, /* generically= */false, withVoid, toBenjamin );

	const possibleError = getError( normalized );
	if ( ( await Z5Validator.validateStatus( possibleError ) ).isValid() ) {
		// forward the error that happened in preliminary normalization
		return normalized;
	}

	const status = await normalZ1Validator.validateStatus( normalized );

	if ( status.isValid() ) {
		return makeMappedResultEnvelope( await canonicalize( normalized.Z22K1, toBenjamin ), null );
	} else {
		return makeMappedResultEnvelope( null, status.getZ5() );
	}
}

module.exports = canonicalizeExport;
