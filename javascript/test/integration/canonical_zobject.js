'use strict';

const fs = require('fs');
const path = require('path');
const schema = require('../../src/schema.js');
const { readYaml } = require('../../src/util.js');
const { testValidation } = require('../util.js');

QUnit.module('canonical_zobject');

const validator_ = schema.Schema.for('CANONICAL');

const testDirectory_ = path.join('..', 'test_data', 'canonical_zobject');

// Every .yaml file in testDirectory_ contains serialized function calls.
fs.readdirSync(testDirectory_).forEach((file) => {
	const fileName = path.join(testDirectory_, file);
	const testDescriptor = readYaml(fileName);
	const info = testDescriptor.test_information;

	testValidation(info.name, validator_, testDescriptor.test_objects);
});
