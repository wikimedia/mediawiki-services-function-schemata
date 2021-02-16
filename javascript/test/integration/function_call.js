'use strict';

const fs = require('fs');
const path = require('path');
const schema = require('../../src/schema.js');
const { readYaml, testValidation } = require('../util.js');

QUnit.module('function_call');

const validator_ = schema.Schema.parse(
	readYaml(
		path.join('..', 'data', 'function_call.yaml')
	)
);

const testDirectory_ = path.join('..', 'test_data', 'function_call');

// Every .yaml file in testDirectory_ contains serialized function calls.
fs.readdirSync(testDirectory_).forEach((file) => {
	const fileName = path.join(testDirectory_, file);
	const testDescriptor = readYaml(fileName);
	const info = testDescriptor.test_information;

	testValidation(info.name, validator_, testDescriptor.test_objects);
});
