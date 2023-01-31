'use strict';

const { compareTypes } = require( '../../../src/compareTypes.js' );
const normalize = require( '../../../src/normalize.js' );

QUnit.module( 'compareTypes.js' );

function Z9_( ZID ) {
	return ZID;
}

function Z3_( typeZ4, nameZ6 ) {
	const labelZ12 = {
		Z1K1: Z9_( 'Z12' ),
		Z12K1: [ 'Z11' ]
	};
	return {
		Z1K1: Z9_( 'Z3' ),
		Z3K1: typeZ4,
		Z3K2: nameZ6,
		Z3K3: labelZ12
	};
}

function Z4_( identity, arrayOfTypes = null ) {
	const Z4K2 = [ 'Z3' ];
	if ( arrayOfTypes !== null ) {
		for ( let i = 0; i < arrayOfTypes.length; ++i ) {
			const keyType = arrayOfTypes[ i ];
			Z4K2.push( Z3_( keyType, 'Z10101K' + ( i + 1 ) ) );
		}
	}
	return {
		Z1K1: Z9_( 'Z4' ),
		Z4K1: identity,
		Z4K2: Z4K2,
		Z4K3: Z9_( 'Z831' )
	};
}

function boldlyNormalize( ZObject ) {
	return normalize( ZObject ).Z22K1;
}

QUnit.test( 'compareTypes is true when either type is a function call', ( assert ) => {
	const someGenericType = boldlyNormalize( {
		Z1K1: Z9_( 'Z7' ),
		Z7K1: Z9_( 'Z881' ),
		Z881K1: Z9_( 'Z1' )
	} );
	const someScrub = boldlyNormalize( Z4_( Z9_( 'Z4' ) ) );

	// Comparand is a function call.
	assert.true( compareTypes( someGenericType, someScrub ) );

	// Comparator is a function call.
	assert.true( compareTypes( someScrub, someGenericType ) );
} );

QUnit.test( 'compareTypes is true when comparator identity is Z1', ( assert ) => {
	// Try with a bare reference.
	const Z1Type = boldlyNormalize( Z9_( 'Z1' ) );
	const someScrub = boldlyNormalize( Z4_( Z9_( 'Z4' ) ) );
	assert.true( compareTypes( someScrub, Z1Type ) );

	// Try with a Z4 whose identity is a bare reference.
	const wrappedZ1 = boldlyNormalize( Z4_( Z1Type ) );
	assert.true( compareTypes( someScrub, wrappedZ1 ) );

	// Just get fun with it.
	const doubleWrappedZ1 = boldlyNormalize( Z4_( wrappedZ1 ) );
	assert.true( compareTypes( someScrub, doubleWrappedZ1 ) );
} );

QUnit.test( 'compareTypes is true when identities are equal', ( assert ) => {
	const canonicalTypeA = Z9_( 'Z6' );
	const typeA = boldlyNormalize( canonicalTypeA );
	const wrappedA = boldlyNormalize( Z4_( typeA ) );

	// Try with bare references.
	assert.true( compareTypes( typeA, typeA ) );

	// Try wrapping comparand.
	assert.true( compareTypes( wrappedA, typeA ) );

	// Try wrapping comparator.
	assert.true( compareTypes( typeA, wrappedA ) );

	// Try wrapping both.
	assert.true( compareTypes( wrappedA, wrappedA ) );
} );

QUnit.test( 'compareTypes is false when identities are not equal', ( assert ) => {
	const canonicalTypeA = Z9_( 'Z6' );
	const canonicalTypeB = Z9_( 'Z4' );
	const typeA = boldlyNormalize( canonicalTypeA );
	const typeB = boldlyNormalize( canonicalTypeB );

	// Try with bare references.
	assert.false( compareTypes( typeA, typeB ) );

	// Try wrapping type A.
	const wrappedA = boldlyNormalize( Z4_( typeA ) );
	assert.false( compareTypes( wrappedA, typeB ) );

	// Try wrapping type B.
	const wrappedB = boldlyNormalize( Z4_( typeB ) );
	assert.false( compareTypes( typeA, wrappedB ) );

	// Try wrapping both.
	assert.false( compareTypes( wrappedA, wrappedB ) );
} );

QUnit.test( 'compareTypes is false when comparandIdentity input identity is not valid', ( assert ) => {
	const canonicalTypeA = Z9_( 'Hello' );
	const canonicalTypeB = Z9_( 'Z2' );
	const typeA = boldlyNormalize( canonicalTypeA );
	const typeB = boldlyNormalize( canonicalTypeB );

	assert.false( compareTypes( typeA, typeB ) );
} );

QUnit.test( 'compareTypes is true when the keys of user-defined types type-compare', ( assert ) => {
	let typeA, typeB;
	const identityA = Z9_( 'Z88888' );
	const identityB = Z9_( 'Z99999' );

	// What if no keys?
	typeA = boldlyNormalize( Z4_( identityA ) );
	typeB = boldlyNormalize( Z4_( identityB ) );
	assert.true( compareTypes( typeA, typeB ) );

	// What if, actually, there are some keys?
	const typeKeys = [ Z9_( 'Z6' ), Z4_( Z9_( 'Z55555' ) ) ];
	typeA = boldlyNormalize( Z4_( identityA, typeKeys ) );
	typeB = boldlyNormalize( Z4_( identityB, typeKeys ) );
	assert.true( compareTypes( typeA, typeB ) );

	// What if we nest it a little bit?
	const keysA = typeKeys.concat( [ boldlyNormalize( Z4_( identityA, typeKeys ) ) ] );
	const keysB = typeKeys.concat( [ boldlyNormalize( Z4_( identityB, typeKeys ) ) ] );
	typeA = boldlyNormalize( Z4_( identityA, keysA ) );
	typeB = boldlyNormalize( Z4_( identityB, keysB ) );
	assert.true( compareTypes( typeA, typeB ) );
} );

QUnit.test( 'compareTypes is false when the keys of user-defined types do not type-compare', ( assert ) => {
	let typeA, typeB;
	const identityA = Z9_( 'Z88888' );
	const identityB = Z9_( 'Z99999' );

	// Try with one discrepancy.
	const shallowKeysA = [ Z9_( 'Z6' ), Z4_( Z9_( 'Z55555' ) ) ];
	const shallowKeysB = [ Z9_( 'Z4' ), Z4_( Z9_( 'Z55555' ) ) ];
	typeA = boldlyNormalize( Z4_( identityA, shallowKeysA ) );
	typeB = boldlyNormalize( Z4_( identityB, shallowKeysB ) );
	assert.false( compareTypes( typeA, typeB ) );

	// Maybe with different numbers of keys?
	const noKeysA = [];
	const oneKeyB = [ Z9_( 'Z4' ) ];
	typeA = boldlyNormalize( Z4_( identityA, noKeysA ) );
	typeB = boldlyNormalize( Z4_( identityB, oneKeyB ) );
	assert.false( compareTypes( typeA, typeB ) );

	// What if we nest it a little bit?
	const deepKeysA = shallowKeysA.concat( [ boldlyNormalize( Z4_( identityA, shallowKeysA ) ) ] );
	const deepKeysB = shallowKeysB.concat( [ boldlyNormalize( Z4_( identityB, shallowKeysB ) ) ] );
	typeA = boldlyNormalize( Z4_( identityA, deepKeysA ) );
	typeB = boldlyNormalize( Z4_( identityB, deepKeysB ) );
	assert.false( compareTypes( typeA, typeB ) );
} );

QUnit.test( 'compareTypes is false when the input identities are not valid', ( assert ) => {
	// This is purely to capture the final 'return' in the code.
	const identity = Z9_( 'Hello' );
	const shallowKeys = [ Z9_( 'Z6' ), Z4_( Z9_( 'Z55555' ) ) ];
	const typeA = boldlyNormalize( Z4_( identity, shallowKeys ) );
	const typeB = boldlyNormalize( Z4_( identity, shallowKeys ) );
	assert.false( compareTypes( typeA, typeB ) );
} );
