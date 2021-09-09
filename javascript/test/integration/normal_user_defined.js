'use strict';

const path = require('path');
const { SchemaFactory } = require('../../src/schema.js');
const { readYaml } = require('../../src/utils.js');
const { testValidation } = require('../util.js');

QUnit.module('NORMAL_USER_DEFINED');

const factory = SchemaFactory.NORMAL();

function test(ZID) {
	const normalFile = path.join('..', 'test_data', 'normal_user_defined', ZID + '.yaml');
	const testDescriptor = readYaml(normalFile);
	const normalValidator = factory.createUserDefined(testDescriptor.test_Z4);
	const info = testDescriptor.test_information;
	testValidation(info.name, normalValidator, testDescriptor.test_objects);
}

test('Z10001');
