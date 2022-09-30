'use strict';

const { Z6Builder } = require( '../../../classes/z6String.js' );

QUnit.module( 'z6String.js' );

QUnit.test( 'Success', ( assert ) => {
	const z6 = new Z6Builder().setValue( 'Hello world' ).build();
	assert.deepEqual( z6.value, 'Hello world' );
	assert.deepEqual( z6.normalJSON, { Z1K1: 'Z6', Z6K1: 'Hello world' } );
} );

QUnit.test( 'Fail', ( assert ) => {
	const wrongType = {
		Z1K1: 'Z9'
	};
	const noValue = {
		Z1K1: 'Z6'
	};
	const extraField = {
		Z1K1: 'Z6',
		Z6K1: 'Hellllllo',
		Z100K1: 42
	};
	assert.throws(
		() => Z6Builder.fromNormalJSON( wrongType ).build()
	);
	assert.throws(
		() => Z6Builder.fromNormalJSON( noValue ).build()
	);
	assert.throws(
		() => Z6Builder.fromNormalJSON( extraField ).build()
	);
} );
