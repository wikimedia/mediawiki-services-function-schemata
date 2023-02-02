'use strict';

/* eslint no-use-before-define: ["error", { "functions": false }] */

const { convertZListToItemArray, isReference, isString, makeMappedResultEnvelope } = require( './utils.js' );
const { SchemaFactory } = require( './schema' );
const normalize = require( './normalize.js' );
const { getError } = require( './utils' );

const normalFactory = SchemaFactory.NORMAL();
const normalZ1Validator = normalFactory.create( 'Z1' );
const Z4Validator = normalFactory.create( 'Z4_literal' );
const Z5Validator = normalFactory.create( 'Z5_literal' );
const Z6Validator = normalFactory.create( 'Z6_literal' );
const Z7Validator = normalFactory.create( 'Z7_literal' );
const Z9Validator = normalFactory.create( 'Z9_literal' );
const TypedListValidator = normalFactory.create( 'LIST_literal' );

function canonicalizeObject( o ) {
	if ( Z9Validator.validate( o ) ) {
		o.Z9K1 = canonicalize( o.Z9K1 );

		// return as string if Z9K1 is a valid reference string
		if ( isString( o.Z9K1 ) && isReference( o.Z9K1 ) ) {
			return o.Z9K1;
		}
	}

	if ( Z6Validator.validate( o ) ) {
		o.Z6K1 = canonicalize( o.Z6K1 );

		// return as string if Z6/String doesn't need to be escaped, i.e., is not in Zxxxx format
		if ( isString( o.Z6K1 ) && !isReference( o.Z6K1 ) ) {
			return o.Z6K1;
		}
	}

	if ( TypedListValidator.validate( o ) ) {
		const itemList = convertZListToItemArray( o ).map( ( e ) => canonicalize( e ) );

		let itemType;
		// FIXME: Should we search recursively for Z881?
		if (
			Z7Validator.validate( o.Z1K1 ) &&
			( canonicalize( o.Z1K1.Z7K1 ) === 'Z881' )
		) {
			// If type is a function call to Z881,
			// itemType is the canonical content of Z88K1.
			itemType = canonicalize( o.Z1K1.Z881K1 );
		} else if (
			Z4Validator.validate( o.Z1K1 ) &&
			Z7Validator.validate( o.Z1K1.Z4K1 ) &&
			( canonicalize( o.Z1K1.Z4K1.Z7K1 ) === 'Z881' )
		) {
			// If type is a literal and Z4K1 is function call to Z881,
			// itemType is the content of Z4K1.Z88K1
			itemType = canonicalize( o.Z1K1.Z4K1.Z881K1 );
		} else {
			// Else, itemType is the whole type ZObject transformed into canonical form.
			itemType = canonicalize( o.Z1K1 );
		}
		return [ itemType ].concat( itemList );
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
	return canonicalizeObject( o );
}

/**
 * Canonicalizes a normalized ZObject. Returns a Z22/'Evaluation result' containing the
 * canonicalized ZObject or a Z5/Error (in the metadata map of the Z22).
 *
 * @param {Object} o a ZObject
 * @return {Array} an array of [data, error]
 */
function canonicalizeExport( o ) {
	const normalized = normalize( o );

	const possibleError = getError( normalized );
	if ( ( Z5Validator.validateStatus( possibleError ) ).isValid() ) {
		// forward the error that happened in preliminary normalization
		return normalized;
	}

	const status = normalZ1Validator.validateStatus( normalized );

	if ( status.isValid() ) {
		return makeMappedResultEnvelope( canonicalize( normalized.Z22K1 ), null );
	} else {
		return makeMappedResultEnvelope( null, status.getZ5() );
	}
}

module.exports = canonicalizeExport;
