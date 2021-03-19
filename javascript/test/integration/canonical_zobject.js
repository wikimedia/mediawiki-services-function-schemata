'use strict';

const path = require('path');
const { SchemaFactory } = require('../../src/schema.js');
const { readYaml } = require('../../src/util.js');
const { testValidation } = require('../util.js');

QUnit.module('canonical_zobject');

const factory = SchemaFactory.CANONICAL();
const validator = factory.create('Z1');
const testFile = path.join('..', 'test_data', 'canonical_zobject', 'canonical_zobject.yaml');
const testDescriptor = readYaml(testFile);
const info = testDescriptor.test_information;
testValidation(info.name, validator, testDescriptor.test_objects);
