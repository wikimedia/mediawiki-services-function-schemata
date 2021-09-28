'use strict';

const { keyForGeneric, SchemaFactory } = require('../../../src/schema.js');

QUnit.module('schema.js');

const factory = new SchemaFactory();

QUnit.test('successful parse', (assert) => {
	// Trivial valid JSON Schema.
	const schema = factory.parse({
		type: 'object'
	});

	assert.notEqual(null, schema);
});

QUnit.test('unsuccessul parse', (assert) => {
	const schema = factory.parse({
		type: 'not supported'
	});
	assert.deepEqual(null, schema);
});

QUnit.test('validation matches ajv\'s decision', (assert) => {
	const schema = factory.parse({
		type: 'object',
		required: ['prop1'],
		properties: {
			prop1: {
				type: 'string'
			}
		}
	});

	// Successful validation; "validate_" is the underlying ajv validator.
	const strongObject = { prop1: 'strong' };
	assert.true(schema.validate(strongObject));
	assert.true(schema.validate_(strongObject));

	// Unsuccessful validation.
	const errayObject = { prop1: ['erray'] };
	assert.false(schema.validate(errayObject));
	assert.false(schema.validate_(errayObject));
});

QUnit.test('ValidationStatus.parserErrors is populated', (assert) => {
	const schema = factory.parse({
		type: 'object',
		required: ['prop1'],
		properties: {
			prop1: {
				type: 'string'
			}
		}
	});

	// Unsuccessful validation populates errors.
	const statusInvalid = schema.validateStatus({ prop1: ['erray'] })

	assert.false(statusInvalid.isValid());
	assert.deepEqual(
		statusInvalid.getParserErrors(),
		[
			{
				"instancePath": "/prop1",
				"schemaPath": "#/properties/prop1/type",
				"keyword": "type",
				"params": {
					"type": "string"
				},
				"message": "must be string",
				"schema": "string",
				"parentSchema": {
					"type": "string"
				},
				"data": [
					"erray"
				]
			}
		],
	);

	// Unsuccessful validation populates errors.
	const statusValid = schema.validateStatus({ prop1: 'string' });

	assert.true(statusValid.isValid());
	assert.deepEqual([], statusValid.getParserErrors());
});

QUnit.test('keyForGeneric with Z7K1 & Z4s as references', (assert) => {
    const Z7 = {
        Z1K1: 'Z7',
        Z7K1: 'Z4200',
        Z4200K1: 'Z14',
        Z4200K2: 'Z17'
    };
    assert.deepEqual( 'Z4200,Z14,Z17', keyForGeneric( Z7 ) );
});

QUnit.test('keyForGeneric with Z7K1 & Z4s as reified types', (assert) => {
    const Z7 = {
        Z1K1: 'Z7',
        Z7K1: {
            Z1K1: 'Z8',
            Z8K5: 'Z4200'
        },
        Z4200K1: {
            Z1K1: 'Z4',
            Z4K1: 'Z14'
        },
        Z4200K2: {
            Z1K1: 'Z4',
            Z4K1: 'Z17'
        }
    };
    assert.deepEqual( 'Z4200,Z14,Z17', keyForGeneric( Z7 ) );
});
