'use strict';

const path = require('path');
const { keyForGeneric, SchemaFactory } = require('../../src/schema.js');
const { readYaml } = require('../../src/utils.js');
const { testValidation } = require('../util.js');

QUnit.module('NORMAL_USER_DEFINED');

const factory = SchemaFactory.NORMAL();

function test(ZID) {
    const normalize = require('../../src/normalize.js');
	const normalFile = path.join('..', 'test_data', 'normal_user_defined', ZID + '.yaml');
	const testDescriptor = readYaml(normalFile);
    const testZ4 = normalize( testDescriptor.test_Z4 );
	const normalValidatorMap = factory.createUserDefined( [ testZ4 ] );
    const genericKey = keyForGeneric( testZ4.Z4K1 );
	const normalValidator = normalValidatorMap.get( genericKey );
	const info = testDescriptor.test_information;
	testValidation(info.name, normalValidator, testDescriptor.test_objects);
}

test('Z10001');
