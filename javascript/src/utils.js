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
	// TODO (T300650): use something more robust
	return JSON.stringify( o1 ) === JSON.stringify( o2 );
}

function deepCopy( o ) {
	return JSON.parse( JSON.stringify( o ) );
}

/**
 * Create a Z23/nothing special object, which isn't a thing and this shouldn't exist.
 *
 * @param {boolean} canonical whether output should be in canonical form
 * @return {Object} a reference to Z23(!)
 * @deprecated Use makeVoid instead.
 */
function makeUnit( canonical = false ) {
	if ( canonical ) {
		return 'Z23';
	}
	return { Z1K1: 'Z9', Z9K1: 'Z23' };
}

/**
 * Create a Z24 / Void object.  (Z24 is the only possible value of the type
 * Z21 / Unit).
 *
 * @param {boolean} canonical whether output should be in canonical form
 * @return {Object} a reference to Z24
 *
 * TODO (T289301): This should read its outputs from a configuration file.
 */
function makeVoid( canonical = false ) {
	if ( canonical ) {
		return 'Z24';
	}
	return { Z1K1: 'Z9', Z9K1: 'Z24' };
}

/**
 * Checks whether the input is a Z24 / Void.  Allows for either canonical
 * or normalized input (corresponding to what makeVoid produces).
 *
 * @param {Object | string} v item to be checked
 * @return {boolean} whether v is a Z24
 */
function isVoid( v ) {
	if ( isString( v ) ) {
		return ( v === 'Z24' );
	}
	if ( isObject( v ) ) {
		return ( v.Z1K1 === 'Z9' && v.Z9K1 === 'Z24' );
	}
	return false;
}

/**
 * Z9 Reference to Z41 (true).
 *
 * @return {Object} a reference to Z41 (true)
 */
function makeTrue() {
	return { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z40' }, Z40K1: { Z1K1: 'Z9', Z9K1: 'Z41' } };
}

/**
 * Z9 Reference to Z42 (false).
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
		Z22K1: goodResult === null ? makeVoid( canonical ) : goodResult,
		Z22K2: badResult === null ? makeVoid( canonical ) : badResult
	};
}

/**
 * Retrieves the head of a ZList.
 *
 * @param {Object} ZList a generic typed list (Z881) or a Z10 (deprecated)
 * @return {Object} the head list element, (Z10)?K1
 */
function getHead( ZList ) {
	// TODO (T292788): Remove support for Z10K1.
	return ZList.Z10K1 || ZList.K1;
}

/**
 * Retrieves the tail of a ZList.
 *
 * @param {Object} ZList a generic typed list (Z881) or a Z10 (deprecated)
 * @return {Array} the tail list element, (Z10)?K2
 */
function getTail( ZList ) {
	// TODO (T292788): Remove support for Z10K1.
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
 * Turns a Z10 into a JS array for ease of iteration.
 *
 * @param {Object} ZList a generic typed list (Z881) or a Z10 (deprecated)
 * @return {Array} an array consisting of all elements of ZList
 */
function convertZListToArray( ZList ) {
	// TODO (T292788): Remove support for Z10K1.
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
 * Turns a JS array into a Typed List after inferring the element type.
 *
 * @param {Array} array an array of ZObjects
 * @param {boolean} canonical whether to output in canonical form
 * @return {Object} a Typed List corresponding to the input array
 */
async function convertArrayToZList( array, canonical = false ) {
	const { ZObjectKeyFactory } = require( './schema.js' );
	let headType;
	const Z1K1s = new Set();
	for ( const element of array ) {
		Z1K1s.add( ( await ZObjectKeyFactory.create( element.Z1K1 ) ).asString() );
	}
	if ( Z1K1s.size === 1 ) {
		headType = array[ 0 ].Z1K1;
	} else {
		headType = 'Z1';
	}
	return convertArrayToKnownTypedList( array, headType, canonical );
}

/**
 * Turns a JS array into a Typed List of a known type.
 *
 * @param {Array} array an array of ZObjects
 * @param {string} type the known type of the typed list
 * @param {boolean} canonical whether to output in canonical form
 * @return {Object} a Typed List corresponding to the input array
 */
function convertArrayToKnownTypedList( array, type, canonical = false ) {
	const listType = getTypedListType( type, canonical );
	return convertArrayToZListInternal( array, 'K1', 'K2', listType );
}

/**
 * Creates the type value of a Typed List given the expected type of its elements.
 *
 * @param {Object|string} elementType for the list, in normal form
 * @param {boolean} canonical whether to output in canonical form
 * @return {Object} the type of a typed list where the elements are the given type
 */
function getTypedListType( elementType, canonical = false ) {
	const listType = {
		Z1K1: canonical ? 'Z7' : wrapInZ9( 'Z7' ),
		Z7K1: canonical ? 'Z881' : wrapInZ9( 'Z881' )
	};

	// elementType can be a string or an object
	// If it's a string, the type is a canonical reference
	// If it's an object, it may be:
	// 1. a normal reference, e.g. { Z1K1: Z9, Z9K1: Z6 }
	// 2. a canonical function call, e.g. { Z1K1: Z7, Z7K1: Z885, Z885K1: Z500 }
	// 3. a normal function call, e.g. {Z1K1:{ Z1K1: Z9, Z9K1: Z7 }, Z7K1:{ Z1K1: Z9, Z9K1: Z999 }}
	if ( isString( elementType ) ) {
		listType.Z881K1 = canonical ? elementType : wrapInZ9( elementType );
	} else {
		if ( elementType.Z1K1 === 'Z9' ) {
			listType.Z881K1 = canonical ? elementType.Z9K1 : elementType;
		} else {
			// FIXME (T304619): If the type is described by a function call,
			// it could be either normal or canonical
			listType.Z881K1 = elementType;
		}
	}

	return listType;
}

const builtInTypes = new Set( [
	'Z1', 'Z10', 'Z11', 'Z12', 'Z14', 'Z16', 'Z17', 'Z18', 'Z2', 'Z20', 'Z21',
	'Z22', 'Z23', 'Z3', 'Z31', 'Z32', 'Z39', 'Z4', 'Z40', 'Z5', 'Z50', 'Z6',
	'Z60', 'Z61', 'Z7', 'Z8', 'Z80', 'Z86', 'Z9', 'Z99'
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

function wrapInKeyReference( key ) {
	return {
		Z1K1: wrapInZ9( 'Z39' ),
		Z39K1: wrapInZ6( key )
	};
}

function wrapInQuote( data ) {
	return {
		Z1K1: wrapInZ9( 'Z99' ),
		Z99K1: data
	};
}

module.exports = {
	arrayToZ10,
	convertArrayToZList,
	convertArrayToKnownTypedList,
	convertZListToArray,
	isString,
	isArray,
	isObject,
	isKey,
	isZid,
	isReference,
	isGlobalKey,
	deepEqual,
	deepCopy,
	getHead,
	getTail,
	getTypedListType,
	inferType,
	isEmptyZList,
	isUserDefined,
	kidFromGlobalKey,
	makeFalse,
	makeResultEnvelope,
	makeTrue,
	makeUnit,
	makeVoid,
	isVoid,
	wrapInKeyReference,
	wrapInQuote,
	wrapInZ6,
	wrapInZ9
};
