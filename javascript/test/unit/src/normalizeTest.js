'use strict';

const path = require( 'path' );

const normalize = require( '../../../src/normalize' );
const { readYaml } = require( '../../../src/utils' );
const { test } = require( '../../testUtils.js' );

QUnit.module( 'normalization' );

const testPath = path.join( 'test_data', 'normalization.yaml' );
const testDescriptor = readYaml( testPath );
const info = testDescriptor.test_information;

// eslint-disable-next-line qunit/no-test-expect-argument
test( info.name, normalize, testDescriptor.test_objects );
