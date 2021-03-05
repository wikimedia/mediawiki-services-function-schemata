'use strict';

const { SchemaFactory } = require('../../../src/schema.js');

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

QUnit.test('errors is populated', (assert) => {
	const schema = factory.parse({
		type: 'object',
		required: ['prop1'],
		properties: {
			prop1: {
				type: 'string'
			}
		}
	});

    // No errors so far.
    assert.deepEqual([], schema.errors);

    // Unsuccessful validation populates errors.
    assert.false(schema.validate({ prop1: ['erray'] }));
    assert.deepEqual(
        [
            {
                keyword: 'type',
                dataPath: '/prop1',
                schemaPath: '#/properties/prop1/type',
                params: {
                    type: 'string'
                },
                message: 'should be string'
            }
        ],
        schema.errors
    );

    // Unsuccessful validation populates errors.
    assert.true(schema.validate({ prop1: 'string' }));
    assert.deepEqual([], schema.errors);
});
