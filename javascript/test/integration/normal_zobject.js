'use strict';

const path = require('path');
const { SchemaFactory } = require('../../src/schema.js');
const { readYaml } = require('../../src/util.js');
const { testValidation } = require('../util.js');

QUnit.module('NORMAL');

const factory = SchemaFactory.NORMAL();

function test(ZID) {
    const normalValidator = factory.create(ZID);
    const normalFile = path.join('..', 'test_data', 'normal_zobject', ZID + '.yaml');
    const testDescriptor = readYaml(normalFile);
	const info = testDescriptor.test_information;
	testValidation(info.name, normalValidator, testDescriptor.test_objects);
}

test('Z1');
test('Z2');
test('Z10');
test('Z22');
test('Z39');
test('Z40');
test('Z86');
