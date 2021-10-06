'use strict';

const path = require('path');
const { SchemaFactory } = require('../../src/schema.js');
const { readYaml } = require('../../src/utils.js');
const { testValidation } = require('../util.js');

QUnit.module('CANONICAL');

const factory = SchemaFactory.CANONICAL();

function test(ZID) {
	const canonicalValidator = factory.create(ZID);
	const canonicalFile = path.join('test_data', 'canonical_zobject', ZID + '.yaml');
	const testDescriptor = readYaml(canonicalFile);
	const info = testDescriptor.test_information;
	testValidation(info.name, canonicalValidator, testDescriptor.test_objects);
}

test('Z1');
test('Z2');
test('Z3');
test('Z4');
test('Z6');
test('Z7');
test('Z7_backend');
test('Z10');
test('Z14');
test('Z17');
test('Z18');
test('Z22');
test('Z39');
test('Z40');
test('Z61');
test('Z80');
test('Z86');
test('Z99');
