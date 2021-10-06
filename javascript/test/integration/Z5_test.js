'use strict';

const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { readYaml } = require( '../../src/utils.js' );
const { testZ5 } = require( '../util.js' );

QUnit.module( 'Z5' );

const factory = SchemaFactory.NORMAL();

function test( ZID ) {
	const normalValidator = factory.create( ZID );
	const normalFile = path.join( 'test_data', 'errors', 'normal_' + ZID + '.yaml' );
	const testDescriptor = readYaml( normalFile );
	const info = testDescriptor.test_information;
	testZ5( info.name, normalValidator, testDescriptor.test_objects );
}

test( 'Z2' );
