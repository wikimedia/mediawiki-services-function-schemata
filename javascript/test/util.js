'use strict';

const fs = require('fs');
const YAML = require('yaml');

function readYaml(fileName) {
	const text = fs.readFileSync(fileName, { encoding: 'utf8' });
	return YAML.parse(text);
}

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

module.exports = { readYaml, testValidation };
