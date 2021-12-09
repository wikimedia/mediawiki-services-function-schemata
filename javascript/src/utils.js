'use strict';

// NOTE: This file is used in a MediaWiki context as well, and so MUST parse as a
// stand-alone JS file without use of require()

function isString( s ) {
	return typeof s === 'string' || s instanceof String;
}

function isArray( a ) {
	return Array.isArray( a );
}

function isObject( o ) {
	return !isArray( o ) && typeof o === 'object' && o !== null;
}

function isKey( k ) {
	return k.match( /^(Z[1-9]\d*)?K[1-9]\d*$/ ) !== null;
}

function isZid( k ) {
	return k.match( /^Z[1-9]\d*$/ ) !== null;
}

function isReference( z ) {
	return z.match( /^[A-Z][1-9]\d*$/ ) !== null;
}

function isGlobalKey( k ) {
	return k.match( /^Z[1-9]\d*K[1-9]\d*$/ ) !== null;
}

function kidFromGlobalKey( k ) {
	return k.match( /^Z[1-9]\d*(K[1-9]\d*)$/ )[ 1 ];
}

function deepEqual( o1, o2 ) {
	// TODO: use something more robust
	return JSON.stringify( o1 ) === JSON.stringify( o2 );
}

function deepCopy( o ) {
	return JSON.parse( JSON.stringify( o ) );
}

// TODO(T285433): Return Z21 instead of Z23.
// TODO(T289301): This should read its outputs from a configuration file.
function makeUnit( canonical = false ) {
	if ( canonical ) {
		return 'Z23';
	}
	return { Z1K1: 'Z9', Z9K1: 'Z23' };
}

/**
 * Z9 Reference to Z41 (true).
 * TODO: T282891
 *
 * @return {Object} a reference to Z41 (true)
 */
function makeTrue() {
	return { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z40' }, Z40K1: { Z1K1: 'Z9', Z9K1: 'Z41' } };
}

/**
 * Z9 Reference to Z42 (false).
 * TODO: T282891
 *
 * @return {Object} a reference to Z42 (false)
 */
function makeFalse() {
	return { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z40' }, Z40K1: { Z1K1: 'Z9', Z9K1: 'Z42' } };
}

/**
 * Creates a Z22 containing goodResult and BadResult.
 *
 * @param {Object} goodResult Z22K1 of resulting Z22
 * @param {Object} badResult Z22K2 of resulting Z22
 * @param {boolean} canonical whether output should be in canonical form
 * @return {Object} a Z22
 */
function makeResultEnvelope( goodResult = null, badResult = null, canonical = false ) {
	let Z1K1;
	if ( canonical ) {
		Z1K1 = 'Z22';
	} else {
		Z1K1 = {
			Z1K1: 'Z9',
			Z9K1: 'Z22'
		};
	}
	return {
		Z1K1: Z1K1,
		Z22K1: goodResult === null ? makeUnit( canonical ) : goodResult,
		Z22K2: badResult === null ? makeUnit( canonical ) : badResult
	};
}

/**
 * @deprecated Use makeResultEnvelope()
 * @param {Object} goodResult Z22K1 of resulting Z22
 * @param {Object} badResult Z22K2 of resulting Z22
 * @param {boolean} canonical whether output should be in canonical form
 * @return {Object} a Z22
 */
function makePair( goodResult = null, badResult = null, canonical = false ) {
	return makeResultEnvelope( goodResult, badResult, canonical );
}

/**
 * Retrieves the head of a ZList.
 *
 * @param {Object} ZList a generic typed list (Z881) or a Z10 (deprecated)
 * @return {Object} the head list element, (Z10)?K1
 */
function getHead( ZList ) {
	// TODO(T292788): Remove support for Z10K1.
	return ZList.Z10K1 || ZList.K1;
}

/**
 * Retrieves the tail of a ZList.
 *
 * @param {Object} ZList a generic typed list (Z881) or a Z10 (deprecated)
 * @return {Array} the tail list element, (Z10)?K2
 */
function getTail( ZList ) {
	// TODO(T292788): Remove support for Z10K1.
	return ZList.Z10K2 || ZList.K2;
}

/**
 * Determines whether an already-validated ZList is empty. Because the list has
 * already been validated, it is sufficient to check for the presence of (Z10)K1.
 *
 * @param {Object} ZList a generic typed list (Z881) or a Z10 (deprecated)
 * @return {boolean} whether ZList is empty
 */
function isEmptyZList( ZList ) {
	return getHead( ZList ) === undefined;
}

/**
 * @deprecated Use isEmptyZList()
 * @param {Object} ZList a generic typed list (Z881) or a Z10 (deprecated)
 * @return {boolean} whether ZList is empty
 */
function isEmpty( ZList ) {
	return isEmptyZList( ZList );
}

/**
 * Turns a Z10 into a JS array for ease of iteration.
 *
 * @param {Object} ZList a generic typed list (Z881) or a Z10 (deprecated)
 * @return {Array} an array consisting of all elements of ZList
 */
function convertZListToArray( ZList ) {
	// TODO(T292788): Remove support for Z10K1.
	let tail = ZList;
	const result = [];
	while ( true ) {
		if ( isEmptyZList( tail ) ) {
			break;
		}
		result.push( getHead( tail ) );
		tail = getTail( tail );
	}
	return result;
}

/**
 * TODO(T292788): Remove this alias after eliminating Z10s.
 *
 * @deprecated Use convertZListToArray()
 * @param {Object} Z10 a generic typed list (Z881) or a Z10 (deprecated)
 * @return {Array} an array consisting of all elements of ZList
 */
function Z10ToArray( Z10 ) {
	return convertZListToArray( Z10 );
}

/**
 * Turns a JS array into a Typed List.
 *
 * @param {Array} array an array of ZObjects
 * @param {string} headKey key to be used for list head (Z10K1 or K1)
 * @param {string} tailKey key to be used for list tail (Z10K2 or K2)
 * @param {Object} tailType list type
 * @return {Object} a Typed List corresponding to the input array
 */
function convertArrayToZListInternal( array, headKey, tailKey, tailType ) {
	function createTail() {
		return { Z1K1: tailType };
	}
	const result = createTail();
	let tail = result;
	for ( const element of array ) {
		tail[ headKey ] = element;
		tail[ tailKey ] = createTail();
		tail = tail[ tailKey ];
	}
	return result;
}

/**
 * Turns a JS array into a Z10.
 *
 * @param {Array} array an array of ZObjects
 * @param {boolean} canonical whether to output in canonical form
 * @return {Object} a Z10 List corresponding to the input array
 */
function arrayToZ10( array, canonical = false ) {
	let Z1K1;
	if ( canonical ) {
		Z1K1 = 'Z10';
	} else {
		Z1K1 = {
			Z1K1: 'Z9',
			Z9K1: 'Z10'
		};
	}
	return convertArrayToZListInternal( array, 'Z10K1', 'Z10K2', Z1K1 );
}

/**
 * Turns a JS array into a Typed List.
 *
 * @param {Array} array an array of ZObjects
 * @param {boolean} canonical whether to output in canonical form
 * @return {Object} a Typed List corresponding to the input array
 */
function convertArrayToZList( array, canonical = false ) {
	const { ZObjectKeyFactory } = require( './schema.js' );
	let headType;
	const Z1K1s = new Set();
	for ( const element of array ) {
		Z1K1s.add( ZObjectKeyFactory.create( element.Z1K1 ).asString() );
	}
	if ( Z1K1s.size === 1 ) {
		headType = array[ 0 ].Z1K1;
	} else {
		headType = 'Z1';
	}
	let Z1K1 = 'Z7';
	let Z7K1 = 'Z881';
	function soupUpZ9( Z9 ) {
		if ( isString( Z9 ) ) {
			return {
				Z1K1: 'Z9',
				Z9K1: Z9
			};
		}
		return Z9;
	}
	if ( !canonical ) {
		headType = soupUpZ9( headType );
		Z1K1 = soupUpZ9( Z1K1 );
		Z7K1 = soupUpZ9( Z7K1 );
	}
	const listType = {
		Z1K1: Z1K1,
		Z7K1: Z7K1,
		Z88K1: headType
	};
	return convertArrayToZListInternal( array, 'K1', 'K2', listType );
}

const builtInTypes = new Set( [
	'Z1', 'Z10', 'Z11', 'Z12', 'Z14', 'Z16', 'Z17', 'Z18', 'Z2', 'Z20', 'Z21',
	'Z22', 'Z23', 'Z3', 'Z31', 'Z32', 'Z39', 'Z4', 'Z40', 'Z5', 'Z50', 'Z6',
	'Z60', 'Z61', 'Z7', 'Z7_backend', 'Z8', 'Z80', 'Z86', 'Z9', 'Z99'
] );

function isUserDefined( ZID ) {
	return !builtInTypes.has( ZID );
}

function inferType( object ) {
	if ( isString( object ) ) {
		if ( isReference( object ) ) {
			return 'Z9';
		}
		return 'Z6';
	}
	if ( isArray( object ) ) {
		return 'Z10';
	}
	return object.Z1K1;
}

function wrapInZ6( zid ) {
	return {
		Z1K1: 'Z6',
		Z6K1: zid
	};
}

function wrapInZ9( zid ) {
	return {
		Z1K1: 'Z9',
		Z9K1: zid
	};
}

module.exports = {
	arrayToZ10,
	convertArrayToZList,
	convertZListToArray,
	// Deprecated alias
	Z10ToArray,
	isString,
	isArray,
	isObject,
	isKey,
	isZid,
	isReference,
	isGlobalKey,
	deepEqual,
	deepCopy,
	inferType,
	isEmptyZList,
	// Deprecated alias
	isEmpty,
	isUserDefined,
	kidFromGlobalKey,
	makeFalse,
	makeResultEnvelope,
	// Deprecated alias
	makePair,
	makeTrue,
	makeUnit,
	wrapInZ6,
	wrapInZ9
};
