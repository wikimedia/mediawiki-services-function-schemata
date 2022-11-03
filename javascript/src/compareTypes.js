'use strict';

const { findIdentity, validatesAsFunctionCall, validatesAsReference, validatesAsType } = require( './schema.js' );
const { convertZListToItemArray } = require( './utils.js' );

/**
 * Determine whether comparand type-compares to comparator.
 *
 * Type-comparison adheres to the following rules. Type A (comparand) type-compares
 * as type B (comparator) iff
 * - the identity of type B is Z1, OR
 * - the identity of type A is identical to that of type B, OR
 * - type A and type B are both Z4s, AND
 *   - for every key in type A, the key's type type-compares as the corresponding
 *     key in type B
 *
 * For the moment, type-comparison just doesn't touch generic types. If either
 * comparand or comparator is a function call, compareTypes returns true.
 *
 * @param {Object} comparand type A, as defined above
 * @param {Object} comparator type B, as defined above
 * @return {boolean} whether comparand type-compares as comparator
 */
function compareTypes( comparand, comparator ) {
	const comparandIdentity = findIdentity( comparand );
	const comparatorIdentity = findIdentity( comparator );

	if ( validatesAsFunctionCall( comparandIdentity ).isValid() ) {
		return true;
	}

	if ( validatesAsFunctionCall( comparatorIdentity ).isValid() ) {
		return true;
	}

	if ( validatesAsReference( comparatorIdentity ).isValid() ) {
		// Case 1: comparatorIdentity is Z1.
		if ( comparatorIdentity.Z9K1 === 'Z1' ) {
			return true;
		}

		// Case 2: identities are both references to built-in types.
		if ( validatesAsReference( comparandIdentity ).isValid() ) {
			return comparandIdentity.Z9K1 === comparatorIdentity.Z9K1;
		}
	}

	// If we reach this point, it means that the two types are user-defined
	// (and not generic for now; see function docstring). In this case, we
	// define type-comparison via a sort of duck-typing. If type A's keys stand
	// in a 1:1 relationship with type B's such that each key in type A
	// type-compares to the corresponding key in type B, then we say that the
	// two types type-compare.
	if ( validatesAsType( comparator ).isValid() && validatesAsType( comparand ).isValid() ) {
		const comparandKeys = convertZListToItemArray( comparand.Z4K2 );
		const comparatorKeys = convertZListToItemArray( comparator.Z4K2 );
		if ( comparatorKeys.length !== comparandKeys.length ) {
			return false;
		}
		for ( const index in comparatorKeys ) {
			const comparatorKey = comparatorKeys[ index ];
			const comparandKey = comparandKeys[ index ];
			if ( !compareTypes( comparandKey.Z3K1, comparatorKey.Z3K1 ) ) {
				return false;
			}
		}
		return true;
	}

	return false;
}

module.exports = { compareTypes };
