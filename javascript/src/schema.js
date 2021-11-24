'use strict';

const Ajv = require( 'ajv' ).default;
const fs = require( 'fs' );
const path = require( 'path' );
const { isString, isUserDefined, readYaml, Z10ToArray } = require( './utils.js' );
const { ValidationStatus } = require( './validationStatus.js' );

let Z4Validator, Z6Validator, Z7Validator, Z8Validator, Z9Validator, Z18Validator;

function initializeValidators() {
	// eslint-disable-next-line no-use-before-define
	const defaultFactory = SchemaFactory.NORMAL();
	Z4Validator = defaultFactory.create( 'Z4' );
	Z6Validator = defaultFactory.create( 'Z6' );
	Z7Validator = defaultFactory.create( 'Z7' );
	Z8Validator = defaultFactory.create( 'Z8' );
	Z9Validator = defaultFactory.create( 'Z9' );
	Z18Validator = defaultFactory.create( 'Z18' );
}

// TODO: Migrate validatesAs* functions to utils. Somehow avoid
// incurring circular import problem in the process.

/**
 * Determines whether argument is a Z4.
 *
 * @param {Object} Z1 a ZObject
 * @return {boolean} true if Z1 validates as Z4
 */
function validatesAsType( Z1 ) {
	return Z4Validator.validate( Z1 ) && !( Z7Validator.validate( Z1 ) );
}

/**
 * Determines whether argument is a Z6 or Z9. These two types' Z1K1s are
 * strings instead of Z9s, so some checks below need to special-case their
 * logic.
 *
 * @param {Object} Z1 a ZObject
 * @return {boolean} true if Z1 validates as either Z6 or Z7
 */
function validatesAsString( Z1 ) {
	// TODO: Prohibit Z18s.
	return Z6Validator.validate( Z1 );
}

/**
 * Determines whether argument is a Z8.
 *
 * @param {Object} Z1 a ZObject
 * @return {boolean} true if Z1 validates as Z8
 */
function validatesAsFunction( Z1 ) {
	return ( Z8Validator.validate( Z1 ) &&
		!( Z9Validator.validate( Z1 ) ) &&
		!( Z18Validator.validate( Z1 ) ) );
}

/**
 * Determines whether argument is a Z9.
 *
 * @param {Object} Z1 a ZObject
 * @return {boolean} true if Z1 validates as Z9
 */
function validatesAsReference( Z1 ) {
	return Z9Validator.validate( Z1 );
}

/**
 * Validates a ZObject against the Function Call schema.
 *
 * @param {Object} Z1 object to be validated
 * @return {boolean} whether Z1 can validated as a Function Call
 */
function validatesAsFunctionCall( Z1 ) {
	return ( Z7Validator.validate( Z1 ) &&
		!( Z9Validator.validate( Z1 ) ) &&
		!( Z18Validator.validate( Z1 ) ) );
}

/**
 * Finds the identity of a type. This might be a Function Call (in the case of
 * a generic type), a Reference (in the case of a builtin), or the Z4 itself
 * (in the case of a user-defined type).
 *
 * @param {Object} Z4 a Type
 * @return {Object|null} the Z4's identity
 */
function findIdentity( Z4 ) {
	if ( validatesAsFunctionCall( Z4 ) || validatesAsReference( Z4 ) ) {
		return Z4;
	}
	if ( validatesAsType( Z4 ) ) {
		const identity = findIdentity( Z4.Z4K1 );
		if ( validatesAsReference( identity ) && isUserDefined( identity.Z9K1 ) ) {
			return Z4;
		}
		return identity;
	}
	throw new Error( `Could not find the identity of ${Z4}` );
}

/**
 * Finds the ZID associated with a type's identity. This might be the ZID of
 * the Function (if identity is a Function Call) or the ZID of a built-in type.
 *
 * @param {Object} Z4 a Type's identity
 * @return {Object|null} the associated ZID
 */
function getZID( Z4 ) {
	if ( validatesAsFunction( Z4 ) ) {
		return getZID( Z4.Z8K5 );
	}
	if ( validatesAsReference( Z4 ) ) {
		return Z4.Z9K1;
	}
	if ( validatesAsFunctionCall( Z4 ) ) {
		return getZID( Z4.Z7K1 );
	}
	if ( validatesAsType( Z4 ) ) {
		return getZID( Z4.Z4K1 );
	}
	if ( isString( Z4 ) ) {
		// If Z4 is a string, original object was a Z6 or a Z9.
		return Z4;
	}
	// I guess this wasn't a very good ZObject.
	throw new Error( `Could not determine type for ${Z4}` );
}

class SimpleTypeKey {
	constructor( ZID ) {
		this.ZID_ = ZID;
	}

	/**
	 * String representation containing the type's ZID.
	 *
	 * @return {string} ZID of builtin type
	 */
	asString() {
		return this.ZID_;
	}
}

class GenericTypeKey {
	constructor( ZID ) {
		this.ZID_ = ZID;
		this.children_ = [];
	}

	addChild( typeKey ) {
		this.children_.push( typeKey );
	}

	/**
	 * String representation containing the identity of the original Z7K1 and
	 * the keys of all of the type arguments.
	 *
	 * TODO(T295373): This assumes that generics will only be parameterized by types.
	 *
	 * @return {string} contains identity of Function and of its arguments
	 */
	asString() {
		const subKeys = [];
		for ( const child of this.children_ ) {
			subKeys.push( child.asString() );
		}
		return this.ZID_ + '[' + subKeys.join( ',' ) + ']';
	}
}

class UserDefinedTypeKey extends GenericTypeKey {
	constructor() {
		super( '' );
	}

	addChild( typeKey ) {
		this.children_.push( typeKey );
	}

	/**
	 * String representation containing the keys of all of the members of the
	 * Z4.
	 *
	 * @return {string} containing identity of type's members
	 */
	asString() {
		const subKeys = [];
		for ( const child of this.children_ ) {
			subKeys.push( child.asString() );
		}
		return '<' + subKeys.join( ',' ) + '>';
	}
}

class TypeKeyFactory {

	/**
	 * Generate a unique identifier for a Z4/Type.
	 *
	 * If the type is built-in, its unique identifier will simply be its ZID.
	 *
	 * If the type is ultimately defined by a generic Z8/Function, the unique
	 * identifier will consist of the ZID of the Function, followed by the unique
	 * idenifiers of its arguments (enclosed in brackets, comma-separated), e.g.
	 *
	 * TODO(T292260): Change the ZIDs.
	 *  {
	 *      Z1K1: Z7,
	 *      Z7K1: Z831,
	 *      Z831K1: Z6,
	 *      Z831K2: Z40
	 *  }
	 *  ( a.k.a. Pair( String, Boolean ) )
	 *
	 * produces a key like
	 *
	 *  "Z831[Z6,Z40]"
	 *
	 * If the type is user-defined, the unique identifier will be the unique
	 * identifiers of the type's attributes (enclosed in angle brackets, comma-
	 * separated), e.g.
	 *
	 *  {
	 *      ...
	 *      Z4K2: [
	 *          { Z3K1: K1, Z3K2: Z40 },
	 *          { Z3K1: K2, Z3K2: Z6 },
	 *          { Z3K1: K3, Z3K2: Z86 }
	 *      ]
	 * }
	 *
	 * produces a key like
	 *
	 *  "<Z40,Z6,Z86>"
	 *
	 * @param { Object } Z4 a type (may be a Z7, a Z4, or a Z9)
	 * @return { Object } SimpleTypeKey, GenericTypeKey, or UserDefinedTypeKey
	 */
	static create( Z4 ) {
		const normalize = require( './normalize.js' );
		const normalized = normalize( Z4 ).Z22K1;
		const identity = findIdentity( normalized );
		const ZID = getZID( identity );
		// Built-in type.
		if ( validatesAsReference( identity ) ) {
			return new SimpleTypeKey( ZID );
		}

		// User-defined and generic types both have children!
		let key = null;
		const children = [];
		if ( validatesAsType( identity ) ) {
			// User-defined type.
			key = new UserDefinedTypeKey();
			for ( const Z3 of Z10ToArray( identity.Z4K2 ) ) {
				children.push( TypeKeyFactory.create( Z3.Z3K1 ) );
			}
		} else if ( validatesAsFunctionCall( identity ) ) {
			// Generic type.
			key = new GenericTypeKey( ZID );
			const argumentKeys = [];
			const skipTheseKeys = new Set( [ 'Z1K1', 'Z7K1' ] );
			for ( const argumentKey of Object.keys( identity ) ) {
				if ( skipTheseKeys.has( argumentKey ) ) {
					continue;
				}
				argumentKeys.push( argumentKey );
			}
			argumentKeys.sort();
			for ( const argumentKey of argumentKeys ) {
				children.push( TypeKeyFactory.create( identity[ argumentKey ] ) );
			}
		} else {
			throw new Error( `Invalid identity for type: ${identity}` );
		}

		for ( const child of children ) {
			key.addChild( child );
		}
		return key;
	}

}

class BaseSchema {

	/**
	 * Validate a JSON object using validateStatus method; return only whether
	 * the result was valid without surfacing errors.
	 *
	 * @param {Object} maybeValid a JSON object
	 * @return {boolean} whether the object is valid
	 */
	validate( maybeValid ) {
		return this.validateStatus( maybeValid ).isValid();
	}
}

class Schema extends BaseSchema {
	constructor( validate ) {
		super();
		this.validate_ = validate;
		this.errors = [];
	}

	/**
	 * Try to validate a JSON object against the internal JSON schema validator.
	 * The results are used to instantiate a ValidationStatus object that is
	 * returned.
	 * Using this method over ''validate'' is preferred.
	 * TODO (T282820): Replace validate with validateStatus and change all related code.
	 *
	 * @param {Object} maybeValid a JSON object
	 * @return {ValidationStatus} a validation status instance
	 */
	validateStatus( maybeValid ) {
		// TODO: Ensure this is atomic--concurrent calls to validate could
		// cause race conditions.
		const result = this.validate_( maybeValid );
		return new ValidationStatus( this.validate_, result );
	}
}

class GenericSchema extends BaseSchema {
	constructor( keyMap ) {
		super();
		this.updateKeyMap( keyMap );
	}

	updateKeyMap( keyMap ) {
		this.keyMap_ = keyMap;
	}

	/**
	 * Try to validate a JSON object against the internal validators. For each
	 * key in maybeValid, the corresponding value will be validated against the
	 * appropriate validator in this.keyMap_.
	 *
	 * The results are used to instantiate a ValidationStatus object that is
	 * returned.
	 *
	 * Using this method over ''validate'' is preferred.
	 *
	 * TODO (T282820): Replace validate with validateStatus and change all related code.
	 *
	 * @param {Object} maybeValid a JSON object
	 * @return {ValidationStatus} a validation status instance
	 */
	validateStatus( maybeValid ) {
		// TODO: Check for stray keys; allow non-local keys for e.g. Z10?
		for ( const key of this.keyMap_.keys() ) {
			// TODO: How to signal optional keys?
			if ( maybeValid[ key ] === undefined ) {
				continue;
			}
			const howsIt = this.keyMap_.get( key ).validateStatus( maybeValid[ key ] );
			if ( !howsIt.isValid() ) {
				// TODO: Somehow include key.
				// TODO: Consider conjunction of all errors?
				return howsIt;
			}
		}
		return new ValidationStatus( null, true );
	}
}

function dataDir( ...pathComponents ) {
	return path.join(
		path.dirname( path.dirname( path.dirname( __filename ) ) ),
		'data', ...pathComponents );
}

class SchemaFactory {

	constructor( ajv = null ) {
		if ( ajv === null ) {
			ajv = new Ajv( { allowMatchingProperties: true, verbose: true } );
		}
		this.ajv_ = ajv;
	}

	/**
	 * Initializes a SchemaFactory linking schemata for canonical ZObjects.
	 *
	 * @return {SchemaFactory} factory with all canonical schemata included
	 */
	static CANONICAL() {
		// Add all schemata for normal ZObjects to ajv's parsing context.
		const ajv = new Ajv( { allowMatchingProperties: true, verbose: true } );
		const directory = dataDir( 'CANONICAL' );
		const fileRegex = /(Z[1-9]\d*(K[1-9]\d*)?(_backend)?)\.yaml/;

		for ( const fileName of fs.readdirSync( directory ) ) {
			if ( fileName.match( fileRegex ) === null ) {
				console.error( "Schema not found: '" + fileName + "'" );
				continue;
			}
			const fullFile = path.join( directory, fileName );
			ajv.addSchema( readYaml( fullFile ) );
		}
		return new SchemaFactory( ajv );
	}

	/**
	 * Initializes a SchemaFactory for mixed form Z1.
	 *
	 * @return {SchemaFactory} factory with lonely mixed form schema
	 */
	static MIXED() {
		const ajv = new Ajv( { allowMatchingProperties: true, verbose: true } );
		const directory = dataDir( 'MIXED' );
		ajv.addSchema( readYaml( path.join( directory, 'Z1.yaml' ) ) );
		return new SchemaFactory( ajv );
	}

	/**
	 * Initializes a SchemaFactory for function calls.
	 *
	 * TODO: Remove this; Z7s can be normal or canonical like anything else.
	 *
	 * @return {SchemaFactory} factory with lonely function call schema
	 */
	static FUNCTION_CALL() {
		// Add all schemata for normal ZObjects to ajv's parsing context.
		const ajv = new Ajv( { allowMatchingProperties: true, verbose: true } );
		const fileName = dataDir( 'function_call', 'Z7.yaml' );
		ajv.addSchema( readYaml( fileName ), 'Z7' );
		return new SchemaFactory( ajv );
	}

	/**
	 * Initializes a SchemaFactory linking schemata for normal-form ZObjects.
	 *
	 * @return {SchemaFactory} factory with all normal-form schemata included
	 */
	static NORMAL() {
		// Add all schemata for normal ZObjects to ajv's parsing context.
		const ajv = new Ajv( { allowMatchingProperties: true, verbose: true } );
		const directory = dataDir( 'NORMAL' );
		const fileRegex = /((Z[1-9]\d*(K[1-9]\d*)?(_backend)?)|(GENERIC))\.yaml/;

		for ( const fileName of fs.readdirSync( directory ) ) {
			if ( fileName.match( fileRegex ) === null ) {
				console.error( "Schema not found: '" + fileName + "'" );
				continue;
			}
			const fullFile = path.join( directory, fileName );
			ajv.addSchema( readYaml( fullFile ) );
		}
		return new SchemaFactory( ajv );
	}

	/**
	 * Try to compile a schema. Use the factory's internal ajv_ in order to
	 * resolve references among multiple files.
	 *
	 * @param {Object} schema a JSON object containing a JSON Schema object
	 * @return {Schema} a Schema wrapping the resulting validator or null
	 */
	parse( schema ) {
		try {
			const validate = this.ajv_.compile( schema );
			return new Schema( validate );
		} catch ( err ) {
			console.log( 'Could not parse schema' );
			console.log( err.message );
			return null;
		}
	}

	/**
	 * Create a schema for the desired native type. A schema for normalized
	 * Z10s, for example, can be created as easily as
	 *
	 *  const factory = SchemaFactory.NORMAL();
	 *  const Z10Schema = factory.create("Z10");
	 *
	 * @param {string} schemaName the name of a supported schema
	 * @return {Schema} a fully-initialized Schema or null if unsupported
	 */
	create( schemaName ) {
		let type = schemaName;
		// TODO: Remove these special cases once references work properly.
		if ( schemaName === 'Z13' ) {
			type = 'Z10';
		}
		if ( schemaName === 'Z41' || schemaName === 'Z42' ) {
			type = 'Z40';
		}
		let validate = null;
		try {
			validate = this.ajv_.getSchema( type );
		} catch ( err ) {
			console.log( 'Could not find schema', schemaName );
			console.log( err.message );
			return null;
		}
		if ( validate === null || validate === undefined ) {
			console.log( 'Could not find schema', schemaName );
			return null;
		}
		return new Schema( validate );
	}

	/**
	 * Create a Map[ key -> BaseSchema] for a given Z4. Resultant Map indicates
	 * against which validators to test the elements of a ZObject with the
	 * corresponding keys.
	 *
	 * @param { Object } Z4 a Z4/Type
	 * @param { Map } typeCache a mapping from type keys (see TypeKeyFactory.create) to BaseSchemata
	 * @return { Map } mapping from type keys to BaseSchemata
	 */
	keyMapForUserDefined( Z4, typeCache ) {
		const keyMap = new Map();
		const Z3s = Z10ToArray( Z4.Z4K2 );
		for ( const Z3 of Z3s ) {
			const propertyName = Z3.Z3K2.Z6K1;
			const propertyType = Z3.Z3K1;
			const identity = findIdentity( propertyType );
			let subValidator;
			if ( validatesAsReference( identity ) ) {
				subValidator = this.create( propertyType.Z9K1 );
			} else {
				const key = TypeKeyFactory.create( propertyType ).asString();
				if ( !( typeCache.has( key ) ) ) {
					typeCache.set( key, this.createUserDefined( [ propertyType ] ).get( key ) );
				}
				subValidator = typeCache.get( key );
			}
			keyMap.set( propertyName, subValidator );
		}
		return keyMap;
	}

	/**
	 * Create a schema for given user-defined type. The Z4 corresponding to the
	 * type must be provided.
	 *
	 * Currently only works for normal form.
	 *
	 * TODO: Make it work for canonical forms, too.
	 *
	 * Usage:
	 *
	 *  // Z4 is a Z4 corresponding to a user-defined type
	 *  const factory = SchemaFactory.NORMAL();
	 *  const Z10001Schema = factory.createUserDefined([Z4]);
	 *
	 * @param {Object} Z4s the descriptor for the user-defined types
	 * @return {Schema} a fully-initialized Schema
	 */
	createUserDefined( Z4s ) {
		const typeCache = new Map();
		const normalize = require( './normalize.js' );
		const normalized = Z4s.map( ( Z4 ) => normalize( Z4 ) );

		// TODO: use an actual validator and have validation errors in normal form (T294175)
		const errorIndex = normalized.map( ( o ) => o.Z22K2.Z1K1 === 'Z5' );
		if ( errorIndex > -1 ) {
			throw new Error( 'Failed to normalized Z4 at index: ' + errorIndex + '. Object: ' + JSON.stringify( Z4s[ errorIndex ] ) );
		}

		const normalZ4s = Z4s.map( ( Z4 ) => normalize( Z4 ).Z22K1 );

		for ( const Z4 of normalZ4s ) {
			if ( validatesAsFunctionCall( findIdentity( Z4 ) ) ) {
				const key = TypeKeyFactory.create( Z4 ).asString();
				typeCache.set( key, new GenericSchema( new Map() ) );
			}
		}
		for ( const Z4 of normalZ4s ) {
			if ( validatesAsFunctionCall( findIdentity( Z4 ) ) ) {
				const key = TypeKeyFactory.create( Z4 ).asString();
				typeCache.get( key ).updateKeyMap( this.keyMapForUserDefined( Z4, typeCache ) );
			}
		}
		return typeCache;
	}

}

initializeValidators();

module.exports = {
	SchemaFactory,
	TypeKeyFactory,
	validatesAsString,
	validatesAsReference,
	validatesAsFunctionCall
};
