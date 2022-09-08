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
	// Note that A1 and Q34 are References but K2 isn't.
	return z.match( /^[A-JL-Z][1-9]\d*$/ ) !== null;
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
 * Retrieves the head of a ZList.
 *
 * @param {Object} ZList a generic typed list (Z881)
 * @return {Object} the head list element, K1
 */
function getHead( ZList ) {
	return ZList.K1;
}

/**
 * Retrieves the tail of a ZList.
 *
 * @param {Object} ZList a generic typed list (Z881)
 * @return {Array} the tail list element, K2
 */
function getTail( ZList ) {
	return ZList.K2;
}

/**
 * Determines whether an already-validated ZList is empty. Because the list has
 * already been validated, it is sufficient to check for the presence of K1.
 *
 * @param {Object} ZList a generic typed list (Z881)
 * @return {boolean} whether ZList is empty
 */
function isEmptyZList( ZList ) {
	return getHead( ZList ) === undefined;
}

/**
 * Turns a ZList into a simple JS array for ease of iteration.
 *
 * @param {Object} ZList a generic typed list (Z881)
 * @return {Array} an array consisting of all elements of ZList
 */
function convertZListToItemArray( ZList ) {
	if ( ZList === undefined ) {
		console.error( 'convertZListToItemArray called with undefined; please fix your caller' );
		return [];
	}

	let tail = ZList;
	const result = [];
	while ( true ) {
		// FIXME: This should only be called on "an already-validated ZList", which this isn't?
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
 * @param {string} headKey key to be used for list head (K1)
 * @param {string} tailKey key to be used for list tail (K2)
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
 * Infers the shared type of an array of normal ZObjects
 *
 * @param {Array} array an array of ZObjects
 * @param {boolean} canonical whether to output in canonical form
 * @return {Object} type of all the elements of the list or Z1
 */
function inferItemType( array, canonical = false ) {
	const { ZObjectKeyFactory } = require( './schema.js' );
	let headType;
	const Z1K1s = new Set();
	for ( const element of array ) {
		Z1K1s.add( ( ZObjectKeyFactory.create( element.Z1K1 ) ).asString() );
	}

	// If inferred type is a resolver type, return Z1 instead
	const resolverTypes = [ 'Z9', 'Z7', 'Z18' ];
	if ( ( Z1K1s.size === 1 ) && ( !resolverTypes.includes( Z1K1s.values().next().value ) ) ) {
		headType = array[ 0 ].Z1K1;
	} else {
		headType = 'Z1';
	}

	return ( isString( headType ) && !canonical ) ? { Z1K1: 'Z9', Z9K1: headType } : headType;
}

/**
 * Turns a JS array of items into a Typed List after inferring the element type.
 *
 * @param {Array} array an array of ZObjects
 * @param {boolean} canonical whether to output in canonical form
 * @param {boolean} benjamin whether to expect a benjamin array as input
 * @return {Object} a Typed List corresponding to the input array
 */
function convertItemArrayToZList( array, canonical = false ) {
	const headType = inferItemType( array, canonical );
	return convertArrayToKnownTypedList( array, headType, canonical );
}

/**
 * Turns a benjamin array into a Typed List. The benjamin array is an array
 * where the first item describes the types of the following ZObjects.
 *
 * @param {Array} array an array of ZObjects
 * @param {boolean} canonical whether to output in canonical form
 * @param {boolean} benjamin whether to expect a benjamin array as input
 * @return {Object} a Typed List corresponding to the input array
 */
function convertBenjaminArrayToZList( array, canonical = false ) {
	const headType = array.length >= 1 ? array[ 0 ] : ( canonical ? 'Z1' : { Z1K1: 'Z9', Z9K1: 'Z1' } );
	return convertArrayToKnownTypedList( array.slice( 1 ), headType, canonical );
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

/**
 * Create a new, empty ZMap with the given valueType.
 * At present, the key type of a ZMap can only be Z6 / String or Z39 / Key reference.
 * TODO (T302015) When ZMap keys are extended beyond Z6/Z39, update accordingly
 *
 * @param {Object} keyType A Z9 instance in normal form
 * @param {Object} valueType A ZObject in normal form
 * @return {Object} a Z883 / ZMap with no entries, in normal form
 */
function makeEmptyZMap( keyType, valueType ) {
	const allowedKeyTypes = [ 'Z6', 'Z39' ];
	if ( !allowedKeyTypes.includes( keyType.Z9K1 ) ) {
		console.error( 'makeEmptyZMap called with invalid keyType' );
		return undefined;
	}
	const mapType = {
		Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
		Z7K1: { Z1K1: 'Z9', Z9K1: 'Z883' },
		Z883K1: keyType,
		Z883K2: valueType
	};
	// The map's K1 property is a list of pairs, and it's required to be present
	// even when empty
	const listType = {
		Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
		Z7K1: { Z1K1: 'Z9', Z9K1: 'Z881' },
		Z881K1: {
			Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
			Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' },
			Z882K1: keyType,
			Z882K2: valueType
		}
	};
	return {
		Z1K1: mapType,
		K1: { Z1K1: listType }
	};
}

/**
 * Create a new, empty ZMap for responses in a Z22/ResponseEnvelope.
 *
 * @return {Object} a Z883 / ZMap with no entries, in normal form
 */
function makeEmptyZResponseEnvelopeMap() {
	return makeEmptyZMap(
		{ Z1K1: 'Z9', Z9K1: 'Z6' },
		{ Z1K1: 'Z9', Z9K1: 'Z1' }
	);
}

/**
 * Does a quick check to determine if the given ZObject is a Z883 / Map.
 * Does not validate the ZObject.
 *
 * @param {Object} ZObject a Z1/ZObject, in canonical or normal form
 * @return {boolean}
 */
function isZMap( ZObject ) {
	return ( ZObject && isObject( ZObject ) && isObject( ZObject.Z1K1 ) &&
		( ( ZObject.Z1K1.Z1K1 === 'Z7' && ZObject.Z1K1.Z7K1 === 'Z883' ) ||
			( isObject( ZObject.Z1K1.Z1K1 ) && isObject( ZObject.Z1K1.Z7K1 ) &&
				ZObject.Z1K1.Z1K1.Z9K1 === 'Z7' && ZObject.Z1K1.Z7K1.Z9K1 === 'Z883' ) ) );
}

/**
 * Ensures there is an entry for the given key / value in the given ZMap.  If there is
 * already an entry for the given key, overwrites the corresponding value.  Otherwise,
 * creates a new entry. N.B.: Modifies the value of the ZMap's K1 in place.
 *
 * TODO (T302015) When ZMap keys are extended beyond Z6/Z39, update accordingly
 *
 * @param {Object} ZMap a Z883/Typed map, in normal form
 * @param {Object} key a Z6 or Z39 instance, in normal form
 * @param {Object} value a Z1/ZObject, in normal form
 * @return {Object} the updated ZMap, in normal form
 */
function setZMapValue( ZMap, key, value ) {
	if ( ZMap === undefined ) {
		console.error( 'setZMapValue called with undefined; please fix your caller' );
		return undefined;
	}

	let tail = ZMap.K1;
	while ( true ) {
		if ( isEmptyZList( tail ) ) {
			break;
		}
		const entry = getHead( tail );
		if ( ( entry.K1.Z1K1 === 'Z6' && key.Z1K1 === 'Z6' && entry.K1.Z6K1 === key.Z6K1 ) ||
			( entry.K1.Z1K1 === 'Z39' && key.Z1K1 === 'Z39' && entry.K1.Z39K1.Z9K1 === key.Z39K1.Z9K1 ) ) {
			entry.K2 = value;
			return ZMap;
		}
		tail = getTail( tail );
	}
	// The key isn't present in the map, so add an entry for it
	const keyType = ZMap.Z1K1.Z883K1;
	const valueType = ZMap.Z1K1.Z883K2;
	const pairType = {
		Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
		Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' },
		Z882K1: keyType,
		Z882K2: valueType
	};
	tail.K1 = { Z1K1: pairType, K1: key, K2: value };
	const listType = tail.Z1K1;
	tail.K2 = { Z1K1: listType };
	return ZMap;
}

/**
 * Return the ZMap value corresponding to the given key, if present.
 * TODO (T302015) When ZMap keys are extended beyond Z6/Z39, update accordingly
 *
 * @param {Object} ZMap a Z883/Typed map, in normal OR canonical form
 * @param {Object} key a Z6 or Z39 instance, in normal OR canonical form (but same form as ZMap)
 * @param {boolean} benjamin If ZMap canonical, whether to expect Benjamin format
 * @return {Object} a Z1/Object, the value of the map entry with the given key,
 * or undefined if there is no such entry
 */
function getZMapValue( ZMap, key, benjamin = true ) {
	if ( ZMap === undefined ) {
		console.error( 'getZMapValue called with undefined; please fix your caller' );
		return undefined;
	}
	if ( isArray( ZMap.K1 ) ) {
		return getValueFromCanonicalZMap( ZMap, key, benjamin );
	}

	let tail = ZMap.K1;
	while ( tail !== undefined ) {
		if ( isEmptyZList( tail ) ) {
			break;
		}
		const entry = getHead( tail );

		if ( ( entry.K1.Z1K1 === 'Z6' && key.Z1K1 === 'Z6' && entry.K1.Z6K1 === key.Z6K1 ) ||
			( entry.K1.Z1K1 === 'Z39' && key.Z1K1 === 'Z39' && entry.K1.Z39K1.Z9K1 === key.Z39K1.Z9K1 ) ) {
			return entry.K2;
		}
		tail = getTail( tail );
	}
	return undefined;
}

/**
 * Return the ZMap value corresponding to the given key, if present.
 * INTERNAL to this file; external callers use getZMapValue.
 * TODO (T302015) When ZMap keys are extended beyond Z6/Z39, update accordingly
 *
 * @param {Object} ZMap a Z883/Typed map, in canonical form
 * @param {Object} key a Z6 or Z39 instance, in canonical form
 * @param {boolean} benjamin whether to expect Benjamin format
 * @return {Object} a Z1/Object, the value of the map entry with the given key,
 * or undefined if there is no such entry
 */
function getValueFromCanonicalZMap( ZMap, key, benjamin = true ) {
	const K1Array = ZMap.K1;
	const firstIndex = benjamin ? 1 : 0;
	for ( let i = firstIndex; i < K1Array.length; i++ ) {
		const entry = K1Array[ i ];
		if ( ( entry.K1 === key ) ||
			( entry.K1.Z1K1 === 'Z6' && key.Z1K1 === 'Z6' && entry.K1.Z6K1 === key.Z6K1 ) ||
			( entry.K1.Z1K1 === 'Z39' && key.Z1K1 === 'Z39' && entry.K1.Z39K1 === key.Z39K1 ) ) {
			return entry.K2;
		}
	}
	return undefined;
}

/**
 * Creates a Z22 containing goodResult and BadResult.
 *
 * @param {Object} goodResult Z22K1 of resulting Z22
 * @param {Object} badResult Z22K2 of resulting Z22
 * @param {boolean} canonical whether output should be in canonical form
 * @return {Object} a Z22
 */
function makeResultEnvelopeWithVoid( goodResult = null, badResult = null, canonical = false ) {
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
 * Creates a map-based Z22 containing result and metadata.  metadata is normally a Z883 / Map.
 * However, if metadata is a Z5 / Error object, we place it in a new ZMap, as the value of an entry
 * with key "errors".  This is to support our transition from the older basic Z22s to map-based
 * Z22s.
 *
 * @param {Object} result Z22K1 of resulting Z22
 * @param {Object} metadata Z22K2 of resulting Z22 - either a Z883 / Map or a Z5 / Error
 * @param {boolean} canonical whether output should be in canonical form
 * @return {Object} a Z22
 */
function makeMappedResultEnvelope( result = null, metadata = null, canonical = false ) {
	let ZMap;
	if ( metadata && !isZMap( metadata ) && ( metadata.Z1K1 === 'Z5' || metadata.Z1K1.Z9K1 === 'Z5' ) ) {
		const keyType = { Z1K1: 'Z9', Z9K1: 'Z6' };
		const valueType = { Z1K1: 'Z9', Z9K1: 'Z1' };
		ZMap = makeEmptyZMap( keyType, valueType );
		setZMapValue( ZMap, { Z1K1: 'Z6', Z6K1: 'errors' }, metadata );
	} else {
		ZMap = metadata;
	}
	let envelopeType;
	if ( canonical ) {
		envelopeType = 'Z22';
	} else {
		envelopeType = {
			Z1K1: 'Z9',
			Z9K1: 'Z22'
		};
	}
	return {
		Z1K1: envelopeType,
		Z22K1: result === null ? makeVoid( canonical ) : result,
		Z22K2: ZMap === null ? makeVoid( canonical ) : ZMap
	};
}

/**
 * Converts a "basic" Z22/Evaluation result into a metadata-map Z22.
 * Z22K1, the result, remains the same.  Z22K2, instead of a Z5/Error (or Z24/void),
 * will contain a Z882/Map (Z6 -> Z1).  If the input Z22K2 contains a Z5,
 * the map will contain an entry with key "errors", holding the Z5 value that previously
 * was in Z22K2.
 *
 * N.B.: Temporary method, supporting transition to map-based Z22.
 * Modifies the value of Z22K2 in place
 *
 * If the input already has a metadata map, returns it without any modification.
 *
 * @param {Object} ResultEnvelope a basic Z22/Evaluation result in normal form
 * @return {Object} a metadata-map Z22/Evaluation result in normal form
 */
function maybeUpgradeResultEnvelope( ResultEnvelope ) {
	if ( ResultEnvelope === undefined ) {
		console.error( 'maybeUpgradeResultEnvelope called with undefined; please fix your caller' );
		return undefined;
	}
	if ( isVoid( ResultEnvelope.Z22K2 ) || isZMap( ResultEnvelope.Z22K2 ) ) {
		// Nothing to do: Z22K2 is void or result envelope already has a metadata map
		return ResultEnvelope;
	}

	const errorValue = ResultEnvelope.Z22K2;
	const keyType = { Z1K1: 'Z9', Z9K1: 'Z6' };
	const valueType = { Z1K1: 'Z9', Z9K1: 'Z1' };
	const ZMap = makeEmptyZMap( keyType, valueType );
	setZMapValue( ZMap, { Z1K1: 'Z6', Z6K1: 'errors' }, errorValue );
	ResultEnvelope.Z22K2 = ZMap;
	return ResultEnvelope;
}

/**
 * Converts a metadata-map Z22/Evaluation result into a "basic" Z22.
 * Z22K1, the result, remains the same.  Z22K2, instead of a Z882/Map (Z6 -> Z1),
 * will contain a Z5/Error extracted from the "errors" entry in the map (or Z24/void if
 * there is no such entry).
 *
 * N.B.: Temporary method, supporting transition to map-based Z22.
 * Modifies the value of Z22K2 in place.
 *
 * If the input is already basic, returns it without any modification.
 *
 * @param {Object} ResultEnvelope a Z22/Evaluation result with metadata map
 * @return {Object} a basic Z22/Evaluation result
 */
function maybeDowngradeResultEnvelope( ResultEnvelope ) {
	if ( ResultEnvelope === undefined ) {
		console.error( 'maybeDowngradeResultEnvelope called with undefined; please fix your caller' );
		return undefined;
	}
	if ( isVoid( ResultEnvelope.Z22K2 ) || !isZMap( ResultEnvelope.Z22K2 ) ) {
		// Nothing to do; Z22K2 is void or result envelope is already basic
		return ResultEnvelope;
	}

	let errorValue = getZMapValue( ResultEnvelope.Z22K2, { Z1K1: 'Z6', Z6K1: 'errors' } );
	if ( errorValue === undefined ) {
		errorValue = makeVoid();
	}
	ResultEnvelope.Z22K2 = errorValue;
	return ResultEnvelope;
}

/**
 * Retrieves the Z5/Error, if present, from the given Z22/Evaluation result (envelope).
 * Works both with older "basic" Z22s and with newer map-based Z22s.
 *
 * @param {Object} envelope a Z22/Evaluation result (envelope), in normal OR canonical form
 * @param {boolean} benjamin If envelope canonical, whether to expect Benjamin format
 * @return {Object} a Z5/Error if the envelope contains an error; Z24/void otherwise
 */
function getError( envelope, benjamin = true ) {
	const metadata = envelope.Z22K2;
	if ( isZMap( metadata ) ) {
		let canonical, key;
		if ( isArray( metadata.K1 ) ) {
			canonical = true;
			key = 'errors';
		} else {
			canonical = false;
			key = { Z1K1: 'Z6', Z6K1: 'errors' };
		}
		let error = getZMapValue( metadata, key, benjamin );
		if ( error === undefined ) {
			error = makeVoid( canonical );
		}
		return error;
	} else {
		return metadata;
	}
}

/**
 * Ensures there is an entry for the given key / value in the metadata map
 * of the given Z22 / Evaluation result (envelope).  If the envelope has
 * no metadata map, creates one.  If there is already an entry for the given key,
 * overwrites the corresponding value.  Otherwise, creates a new entry.
 * N.B.: May modify the value of Z22K2 and the ZMap's K1 in place.
 *
 * @param {Object} envelope a Z22/Evaluation result, in normal form
 * @param {Object} key a Z6 or Z39 instance, in normal form
 * @param {Object} value a Z1/ZObject, in normal form
 * @return {Object} the updated envelope, in normal form
 */
function setMetadataValue( envelope, key, value ) {
	let zMap = envelope.Z22K2;
	if ( zMap === undefined || isVoid( zMap ) ) {
		const keyType = { Z1K1: 'Z9', Z9K1: 'Z6' };
		const valueType = { Z1K1: 'Z9', Z9K1: 'Z1' };
		zMap = makeEmptyZMap( keyType, valueType );
	}
	zMap = setZMapValue( zMap, key, value );
	envelope.Z22K2 = zMap;
	return envelope;
}

const builtInTypesArray_ = Object.freeze( [
	'Z1', 'Z11', 'Z12', 'Z14', 'Z16', 'Z17', 'Z18', 'Z2', 'Z20', 'Z21',
	'Z22', 'Z23', 'Z3', 'Z31', 'Z32', 'Z39', 'Z4', 'Z40', 'Z5', 'Z50', 'Z6',
	'Z60', 'Z61', 'Z7', 'Z8', 'Z80', 'Z86', 'Z9', 'Z99'
] );
const builtInTypes_ = new Set( builtInTypesArray_ );

function builtInTypes() {
	return builtInTypesArray_;
}

function isBuiltInType( ZID ) {
	return builtInTypes_.has( ZID );
}

function isUserDefined( ZID ) {
	return !builtInTypes_.has( ZID );
}

function inferType( object ) {
	if ( isString( object ) ) {
		if ( isReference( object ) ) {
			return 'Z9';
		}
		return 'Z6';
	}
	if ( isArray( object ) ) {
		return 'LIST';
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
	builtInTypes,
	convertItemArrayToZList,
	convertBenjaminArrayToZList,
	convertArrayToKnownTypedList,
	convertZListToItemArray,
	inferItemType,
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
	isBuiltInType,
	isEmptyZList,
	isUserDefined,
	kidFromGlobalKey,
	makeFalse,
	makeResultEnvelopeWithVoid,
	makeMappedResultEnvelope,
	makeTrue,
	makeVoid,
	isVoid,
	wrapInKeyReference,
	wrapInQuote,
	wrapInZ6,
	wrapInZ9,
	makeEmptyZMap,
	makeEmptyZResponseEnvelopeMap,
	isZMap,
	setZMapValue,
	getZMapValue,
	maybeUpgradeResultEnvelope,
	maybeDowngradeResultEnvelope,
	getError,
	setMetadataValue
};
