'use strict';

const Ajv = require('ajv').default;
const fs = require('fs');
const path = require('path');
const { readYaml, Z10ToArray } = require('./utils.js');
const { ValidationStatus } = require('./validationStatus.js');

let Z6Validator, Z7Validator, Z9Validator, Z18Validator;

function initializeValidators() {
	// eslint-disable-next-line no-use-before-define
    const defaultFactory = SchemaFactory.NORMAL();
    Z6Validator = defaultFactory.create('Z6');
    Z7Validator = defaultFactory.create('Z7');
    Z9Validator = defaultFactory.create('Z9');
    Z18Validator = defaultFactory.create('Z18');
}

// TODO: Migrate is(String|Reference|FunctionCall) to utils. Somehow avoid
// incurring circular import problem in the process.

/**
 * Determines whether argument is a Z6 or Z9. These two types' Z1K1s are
 * strings instead of Z9s, so some checks below need to special-case their
 * logic.
 *
 * @param {Object} Z1 a ZObject
 * @return {boolean} true if Z1 validates as either Z6 or Z7
 */
function validatesAsString(Z1) {
    // TODO: Prohibit Z18s.
    return Z6Validator.validate(Z1);
}

/**
 * Determines whether argument is a Z9.
 *
 * @param {Object} Z1 a ZObject
 * @return {bool} true if Z1 validates as Z9
 */
function validatesAsReference(Z1) {
    return Z9Validator.validate(Z1);
}

/**
 * Validates a ZObject against the Function Call schema.
 *
  @param {Object} Z1 object to be validated
 * @return {bool} whether Z1 can validated as a Function Call
 */
function validatesAsFunctionCall(Z1) {
    return (Z7Validator.validate(Z1) &&
        !(Z9Validator.validate(Z1)) &&
        !(Z18Validator.validate(Z1)));
}

class BaseSchema {

	/**
	 * Validate a JSON object using validateStatus method; return only whether
	 * the result was valid without surfacing errors.
	 *
	 * @param {Object} maybeValid a JSON object
	 * @return {bool} whether the object is valid
	 */
	validate(maybeValid) {
        return this.validateStatus(maybeValid).isValid();
	}
}

class Schema extends BaseSchema {
	constructor(validate) {
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
	validateStatus(maybeValid) {
        // TODO: Ensure this is atomic--concurrent calls to validate could
        // cause race conditions.
		const result = this.validate_(maybeValid);
		return new ValidationStatus(this.validate_, result);
	}
}

class GenericSchema extends BaseSchema {
    constructor(keyMap) {
        super();
        this.updateKeyMap(keyMap);
    }

    updateKeyMap(keyMap) {
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
    validateStatus(maybeValid) {
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
        return new ValidationStatus(null, true);
    }
}

function dataDir(...pathComponents) {
	return path.join(
			path.dirname(path.dirname(path.dirname(__filename))),
			'data', ...pathComponents);
}

function identityOfFunction( Z8 ) {
    if ( validatesAsReference( Z8 ) ) {
        return Z8.Z9K1;
    } else {
        // Presumably a full-on Z8.
        return Z8.Z8K5.Z9K1;
    }
}

function identityOfType( Z4 ) {
    if ( validatesAsReference( Z4 ) ) {
        return Z4.Z9K1;
    } else {
        // A regular, fleshed-out Z4, one hopes.
        return Z4.Z4K1.Z9K1;
    }
}

/**
 * Generate a unique identifier for a Z7/Function Call that returns a Z4/Type.
 *
 * @param { Object } genericZ7 Z7 that produces a Z4
 * @return { string } a unique key containing the identity of Z7K1 and the type arguments
 */
function keyForGeneric( genericZ7 ) {
    const normalize = require('./normalize.js');
    const Z7 = normalize( genericZ7 );
    const result = [ identityOfFunction( Z7.Z7K1 ) ];
    const argumentKeys = [];
    for ( const key of Object.keys( Z7 ) ) {
        if ( new Set([ 'Z1K1', 'Z7K1' ]).has( key ) ) {
            continue;
        }
        argumentKeys.push( key );
    }
    argumentKeys.sort();
    for ( const key of argumentKeys ) {
        result.push( identityOfType( Z7[ key ] ) );
    }
    // TODO: This sucks; why doesn't JS have an immutable container type that
    // can be used as a map key?????
    return result.join(',');
}

class SchemaFactory {

	constructor(ajv = null) {
		if (ajv === null) {
			ajv = new Ajv({ allowMatchingProperties: true, verbose: true });
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
		const ajv = new Ajv({ allowMatchingProperties: true, verbose: true });
		const directory = dataDir('CANONICAL');
		const fileRegex = /(Z[1-9]\d*(K[1-9]\d*)?(_backend)?)\.yaml/;

		for (const fileName of fs.readdirSync(directory)) {
			if (fileName.match(fileRegex) === null) {
				console.error("Schema not found: '" + fileName + "'");
				continue;
			}
			const fullFile = path.join(directory, fileName);
			ajv.addSchema(readYaml(fullFile));
		}
		return new SchemaFactory(ajv);

	}

	/**
	 * Initializes a SchemaFactory for mixed form Z1.
	 *
	 * @return {SchemaFactory} factory with lonely mixed form schema
	 */
	static MIXED() {
		const ajv = new Ajv({ allowMatchingProperties: true, verbose: true });
		const directory = dataDir('MIXED');
		ajv.addSchema(readYaml(path.join(directory, 'Z1.yaml')));
		return new SchemaFactory(ajv);
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
		const ajv = new Ajv({ allowMatchingProperties: true, verbose: true });
		const fileName = dataDir('function_call', 'Z7.yaml');
		ajv.addSchema(readYaml(fileName), 'Z7');
		return new SchemaFactory(ajv);
	}

	/**
	 * Initializes a SchemaFactory linking schemata for normal-form ZObjects.
	 *
	 * @return {SchemaFactory} factory with all normal-form schemata included
	 */
	static NORMAL() {
		// Add all schemata for normal ZObjects to ajv's parsing context.
		const ajv = new Ajv({ allowMatchingProperties: true, verbose: true });
		const directory = dataDir('NORMAL');
		const fileRegex = /((Z[1-9]\d*(K[1-9]\d*)?(_backend)?)|(GENERIC))\.yaml/;

		for (const fileName of fs.readdirSync(directory)) {
			if (fileName.match(fileRegex) === null) {
				console.error("Schema not found: '" + fileName + "'");
				continue;
			}
			const fullFile = path.join(directory, fileName);
			ajv.addSchema(readYaml(fullFile));
		}
		return new SchemaFactory(ajv);
	}

	/**
	 * Try to compile a schema. Use the factory's internal ajv_ in order to
	 * resolve references among multiple files.
	 *
	 * @param {Object} schema a JSON object containing a JSON Schema object
	 * @return {Schema} a Schema wrapping the resulting validator or null
	 */
	parse(schema) {
		try {
			const validate = this.ajv_.compile(schema);
			return new Schema(validate);
		} catch (err) {
			console.log('Could not parse schema:');
			console.log(err.message);
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
	create(schemaName) {
		let type = schemaName;
		// TODO: Remove these special cases once references work properly.
		if (schemaName === 'Z13') {
			type = 'Z10';
		}
		if (schemaName === 'Z41' || schemaName === 'Z42') {
			type = 'Z40';
		}
		const validate = this.ajv_.getSchema(type);
        // console.log("creating schema; validate is", validate);
		if (validate === null || validate === undefined) {
			return null;
		}
		return new Schema(validate);
	}

    /**
     * Create a Map[ key -> BaseSchema] for a given Z4. Resultant Map indicates
     * against which validators to test the elements of a ZObject with the
     * corresponding keys.
     *
     * @param { Object } Z4 a Z4/Type
     * @param { Map } typeCache a mapping from type keys (see keyForGeneric) to BaseSchemata
     * @return { Map } mapping from type keys to BaseSchemata
     */
    keyMapForUserDefined( Z4, typeCache ) {
        const keyMap = new Map();
        const Z3s = Z10ToArray( Z4.Z4K2 );
        for ( const Z3 of Z3s ) {
            const propertyName = Z3.Z3K2.Z6K1;
            const propertyType = Z3.Z3K1;
            let subValidator;
            if ( validatesAsReference( propertyType ) ) {
                subValidator = this.create( propertyType.Z9K1 );
            } else {
                const key = keyForGeneric( propertyType );
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
	 *  const Z10001Schema = factory.createUserDefined(Z4);
	 *
	 * @param {Object} Z4s the descriptor for the user-defined types
	 * @return {Schema} a fully-initialized Schema
	 */
	createUserDefined( Z4s ) {
        const typeCache = new Map();
		const normalize = require('./normalize.js');
        const normalZ4s = Z4s.map( normalize );
        for ( const Z4 of normalZ4s ) {
            if ( validatesAsFunctionCall( Z4.Z4K1 ) ) {
                const key = keyForGeneric(Z4.Z4K1);
                typeCache.set( key, new GenericSchema(new Map()) );
            }
        }
        for ( const Z4 of normalZ4s ) {
            if ( validatesAsFunctionCall( Z4.Z4K1 ) ) {
                const key = keyForGeneric(Z4.Z4K1);
                typeCache.get( key ).updateKeyMap( this.keyMapForUserDefined( Z4, typeCache ) );
            }
        }
        return typeCache;
	}

}

initializeValidators();

module.exports = { keyForGeneric, SchemaFactory, validatesAsString, validatesAsReference, validatesAsFunctionCall };
