'use strict';

const Ajv = require('ajv').default;
const fs = require('fs');
const path = require('path');
const { readYaml, Z10ToArray } = require('./utils.js');

class Schema {
	constructor(validate) {
		this.validate_ = validate;
		this.errors = [];
	}

	/**
	 * Try to validate a JSON object against the internal JSON schema validator.
	 * Set internal errors array after each validation: if validation succeeds,
	 * errors will be empty; if not, it will be populated.
	 *
	 * @param {Object} maybeValid a JSON object
	 * @return {bool} whether the object is valid
	 */
	validate(maybeValid) {
		const result = this.validate_(maybeValid);
		if (result) {
			this.errors = [];
			return true;
		}
		this.errors = this.validate_.errors;
		return false;
	}
}

function dataDir(...pathComponents) {
	return path.join(
			path.dirname(path.dirname(path.dirname(__filename))),
			'data', ...pathComponents);
}

// TODO(T290695): Support canonical version of this, too.
function defaultZ1K1For( type ) {
	return {
		'allOf': [
			{ '$ref': 'Z9#/definitions/objects/Z9' },
			{
				'type': 'object',
				'additionalProperties': false,
				'properties': {
					'Z1K1': { 'enum': [ 'Z9' ], 'type': 'string' },
					'Z9K1': { 'enum': [ type ], 'type': 'string' },
				},
				'required': [ 'Z1K1', 'Z9K1' ]
			}
		]
	};
}

class SchemaFactory {

	constructor(ajv = null) {
		if (ajv === null) {
			ajv = new Ajv({ allowMatchingProperties: true });
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
		const ajv = new Ajv({ allowMatchingProperties: true });
		const fileName = dataDir('CANONICAL', 'canonical_zobject.yaml');
		ajv.addSchema(readYaml(fileName), 'Z1');
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
		const ajv = new Ajv({ allowMatchingProperties: true });
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
		const ajv = new Ajv({ allowMatchingProperties: true });
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
		if (validate === null) {
			return null;
		}
		return new Schema(validate);
	}


	/**
	 * Create a schema for a user-defined type. The Z4 corresponding to the
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
	 * @param {Object} Z4 the descriptor for a user-defined type
	 * @return {Schema} a fully-initialized Schema
	 */
	createUserDefined(Z4) {
		const normalize = require('./normalize.js');
		// Generate a JSON Schema spec for the type.
		Z4 = normalize( Z4 );
		const userDefinedSchema = {};
		const type = Z4.Z4K1.Z9K1;
		userDefinedSchema[ '$id' ] = type;
		userDefinedSchema[ '$ref' ] = '#/definitions/objects/' + type;
		const objects = {};
		userDefinedSchema[ 'definitions' ] = {
			'objects': objects
		};
		const literalType = type + '_literal';
		objects[ type ] = {
			'anyOf': [
				{ '$ref': '#/definitions/objects/' + literalType },
				{ '$ref': 'Z9#/definitions/objects/Z9' },
				{ '$ref': 'Z18#/definitions/objects/Z18' },
			]
		};
		const literal = {
			'type': 'object',
			'additionalProperties': false,
		};
		objects[ literalType ] = literal;
		const properties = { 'Z1K1': defaultZ1K1For( type ) };
		literal[ 'properties' ] = properties;
		const required = [];
		literal[ 'required' ] = required;
		const Z3s = Z10ToArray( Z4.Z4K2 );
		for ( const Z3 of Z3s ) {
			const propertyName = Z3.Z3K2.Z6K1;
			const propertyType = Z3.Z3K1.Z9K1;
			properties[ propertyName ] = {
				'$ref': propertyType + '#/definitions/objects/' + propertyType
			};
			required.push( propertyName );
		}
		this.ajv_.addSchema( userDefinedSchema );
		return this.create( type );
	};

}

module.exports = { SchemaFactory };
