'use strict';

const fs = require('fs');
const path = require('path');
const schema = require('../../src/schema.js');
const { readYaml, testValidation } = require('../util.js');

QUnit.module('simple_schemata');

const directory_ = path.join('..', 'test_data', 'simple_schemata');

// Every .yaml file in directory_ contains a validator schema and objects which
// should (or should not) validate against that schema.
fs.readdirSync(directory_).forEach((file) => {
	const fileName = path.join(directory_, file);
	const testDescriptor = readYaml(fileName);
	const info = testDescriptor.test_information;
	const validator = schema.Schema.parse(testDescriptor.test_schema.validator);

	if (info.parse_error) {
		// When parse_error is true, the schema itself is degenerate, so parse()
		// should return null.
		QUnit.test(info.name, (assert) => {
			assert.deepEqual(null, validator);
		});
	} else {
		// Validator was parsed successfully; test validation of objects.
		testValidation(info.name, validator, testDescriptor.test_objects);
	}
});
