'use strict';

const { Z9Builder } = require( '../../../classes/z9Reference.js' );
const { validatesAsReference } = require( '../../../src/schema.js' );

QUnit.module( 'z9Reference.js' );

QUnit.test( 'Z9Builder fromNormalJSON: success', ( assert ) => {
	const builder = Z9Builder.fromNormalJSON( { Z1K1: 'Z9', Z9K1: 'Z10008' } );
	assert.strictEqual( builder.Z1K1, 'Z9' );
	assert.strictEqual( builder.Z9K1, 'Z10008' );
} );

QUnit.test( 'Z9Builder normalJSON: success', ( assert ) => {
	const builder = new Z9Builder().setId( 'Z10008' );
	assert.deepEqual( builder.normalJSON, { Z1K1: 'Z9', Z9K1: 'Z10008' } );
} );

QUnit.test( 'Z9Builder normalJSON: partial', ( assert ) => {
	const builder = new Z9Builder();
	assert.deepEqual( builder.normalJSON, { Z1K1: 'Z9', Z9K1: undefined } );
} );

QUnit.test( 'Z9Builder fromZ9Reference: success', async ( assert ) => {
	const correctZ9 = await new Z9Builder().setId( 'Z10008' ).build();
	const builder = Z9Builder.fromZ9Reference( correctZ9 );
	assert.strictEqual( builder.Z1K1, 'Z9' );
	assert.strictEqual( builder.Z9K1, 'Z10008' );
	assert.deepEqual( correctZ9.normalJSON, builder.normalJSON );
} );

QUnit.test( 'Z9Builder fromZ9Reference: modified afterwards', async ( assert ) => {
	const correctZ9 = await new Z9Builder().setId( 'Z10008' ).build();
	const builder = Z9Builder.fromZ9Reference( correctZ9 );
	builder.setId( 'Z10009' );
	assert.strictEqual( builder.Z1K1, 'Z9' );
	assert.strictEqual( builder.Z9K1, 'Z10009' );
} );

QUnit.test( 'Z9Reference: success', async ( assert ) => {
	const correctZ9 = await new Z9Builder().setId( 'Z10008' ).build();
	assert.strictEqual( correctZ9.id, 'Z10008' );
	assert.deepEqual( correctZ9.normalJSON, { Z1K1: 'Z9', Z9K1: 'Z10008' } );
	assert.true( ( await validatesAsReference( correctZ9.normalJSON ) ).isValid() );
} );

QUnit.test( 'Z9Reference: incomplete', ( assert ) => {
	assert.rejects(
		new Z9Builder().build(),
		( err ) => err.toString().includes( 'Validation failed' )
	);
} );

QUnit.test( 'Z9Reference: attempt to modify properties', async ( assert ) => {
	const correctZ9 = await new Z9Builder().setId( 'Z100' ).build();
	assert.throws(
		() => { correctZ9.id = 'Z101'; }
	);
	assert.throws(
		() => { correctZ9.normalJSON = { Z1K1: 'Z9', Z9K1: 'Z101' }; }
	);
} );

QUnit.test( 'Z9Reference: attempt to modify seed JSON after creation', async ( assert ) => {
	const seedJSON = {
		Z1K1: 'Z9',
		Z9K1: 'Z100'
	};
	const correctZ9 = await Z9Builder.fromNormalJSON( seedJSON ).build();
	// You can still modify the seed object, but it won't impact the Z9 object.
	seedJSON.Z9K1 = 'Z101';
	assert.strictEqual( correctZ9.id, 'Z100' );
} );

QUnit.test( 'Z9Reference: attempt to modify JSON through getter', async ( assert ) => {
	const correctZ9 = await new Z9Builder().setId( 'Z100' ).build();
	const normalJSON = correctZ9.normalJSON;
	// A potential way to compromise an immutable object's mutability is modifing its property
	// through the getter. Here we are checking to see it won't happen because the Z9 is recursively
	// frozen.
	assert.throws(
		() => { normalJSON.Z9K1 = 'Z101'; }
	);
} );
