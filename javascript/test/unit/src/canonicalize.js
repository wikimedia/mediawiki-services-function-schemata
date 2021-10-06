'use strict';

const path = require( 'path' );

const canonicalize = require( '../../../src/canonicalize' );
const { readYaml } = require( '../../../src/utils' );
const { test } = require( '../../util.js' );

QUnit.module( 'canonicalization' );

const testPath = path.join( 'test_data', 'canonicalization.yaml' );
const testDescriptor = readYaml( testPath );
const info = testDescriptor.test_information;

// eslint-disable-next-line qunit/no-test-expect-argument
test( info.name, canonicalize, testDescriptor.test_objects );
