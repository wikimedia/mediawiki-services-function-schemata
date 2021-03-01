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

module.exports = { testValidation };
