'use strict';

function testValidation(baseName, validator, testObjects) {
	// Serialized function calls subsumed in the "success" block should validate
	// successfully.
	const successes = testObjects.success || [];
	for (let i = 0; i < successes.length; ++i) {
		const testObject = successes[i];
		const name = baseName + ': ' + testObject.name;
		QUnit.test(name, (assert) => {
			assert.true(validator.validate(testObject.object));
		});
	}

	// Calls in the "failure" block should not validate successfully.
	const failures = testObjects.failure || [];
	for (let i = 0; i < failures.length; ++i) {
		const testObject = failures[i];
		const name = baseName + ': ' + testObject.name;
		QUnit.test(name, (assert) => {
			assert.false(validator.validate(testObject.object));
		});
	}
}

/**
 * Runs a set of tests for the given function.
 *
 * @param {string} baseName the test set name as defined in the .yaml
 * @param {Function} fn the function that will be tested
 * @param {Object} testObjects the .yaml object containing test definitions
 */
function test(baseName, fn, testObjects) {
	const successes = testObjects.success || [];
	successes.forEach((testObject) => {
		QUnit.test(`${baseName}: ${testObject.name}`, (assert) => {
			assert.deepEqual(fn(testObject.object), testObject.expected);
		});
	});

	const errors = testObjects.throws || [];
	errors.forEach((testObject) => {
		QUnit.test(`${baseName}: ${testObject.name}`, (assert) => {
			// TODO: we could have a RegExp as argumento to "throws" for a error message match
			assert.throws(() => fn(testObject.object));
		});
	});
}

module.exports = { test, testValidation };
