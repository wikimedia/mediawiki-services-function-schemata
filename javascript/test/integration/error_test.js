'use strict';

const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { readYaml } = require( '../../src/fileUtils.js' );
const { testErrors } = require( '../testUtils.js' );

QUnit.module( 'Z5' );

const factory = SchemaFactory.NORMAL();

async function test( ZID ) {
	const normalValidator = factory.create( ZID );
	const errorValidator = factory.create( 'Z5' );
	const normalFile = path.join( 'test_data', 'errors', 'normal_' + ZID + '.yaml' );
	const testDescriptor = readYaml( normalFile );
	const info = testDescriptor.test_information;
	await testErrors( info.name, normalValidator, testDescriptor.test_objects, errorValidator );
}

test( 'Z2' ).then();
