'use strict';

const path = require( 'path' );
const { SchemaFactory } = require( '../../src/schema.js' );
const { readYaml } = require( '../../src/fileUtils.js' );
const { testValidation } = require( '../testUtils.js' );

QUnit.module( 'CANONICAL' );

const factory = SchemaFactory.CANONICAL();

async function test( ZID ) {
	const canonicalValidator = factory.create( ZID );
	const canonicalFile = path.join( 'test_data', 'canonical_zobject', ZID + '.yaml' );
	const testDescriptor = readYaml( canonicalFile );
	const info = testDescriptor.test_information;
	await testValidation( info.name, canonicalValidator, testDescriptor.test_objects );
}

test( 'Z1' ).then();
test( 'Z2' ).then();
test( 'Z3' ).then();
test( 'Z4' ).then();
test( 'Z6' ).then();
test( 'Z7' ).then();
test( 'Z7_backend' ).then();
test( 'Z10' ).then();
test( 'Z14' ).then();
test( 'Z17' ).then();
test( 'Z18' ).then();
test( 'Z22' ).then();
test( 'Z39' ).then();
test( 'Z40' ).then();
test( 'Z61' ).then();
test( 'Z80' ).then();
test( 'Z86' ).then();
test( 'Z99' ).then();
