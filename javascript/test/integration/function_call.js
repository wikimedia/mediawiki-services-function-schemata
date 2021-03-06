'use strict';

const fs = require('fs');
const path = require('path');
const { SchemaFactory } = require('../../src/schema.js');
const { readYaml } = require('../../src/util.js');
const { testValidation } = require('../util.js');

QUnit.module('function_call');

// TODO: Collapse this test into normal/canonical tests.
const factory = SchemaFactory.FUNCTION_CALL();
const validator_ = factory.create('Z7');
const testDirectory_ = path.join('..', 'test_data', 'function_call');

// Every .yaml file in testDirectory_ contains serialized function calls.
fs.readdirSync(testDirectory_).forEach((file) => {
	const fileName = path.join(testDirectory_, file);
	const testDescriptor = readYaml(fileName);
	const info = testDescriptor.test_information;

	testValidation(info.name, validator_, testDescriptor.test_objects);
});
