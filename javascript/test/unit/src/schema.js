'use strict';

const { Schema } = require('../../../src/schema.js');

QUnit.module('schema.js');

QUnit.test('successful parse', (assert) => {
	// Trivial valid JSON Schema.
	const schema = Schema.parse({
		type: 'object'
	});

	assert.true(schema instanceof Schema);
});

QUnit.test('unsuccessul parse', (assert) => {
	const schema = Schema.parse({
		type: 'not supported'
	});
	assert.deepEqual(null, schema);
});

QUnit.test('validation matches ajv\'s decision', (assert) => {
	const schema = Schema.parse({
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
