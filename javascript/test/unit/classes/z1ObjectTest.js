'use strict';

const { Z1Builder } = require( '../../../classes/z1Object.js' );

QUnit.module( 'z1Object.js' );

QUnit.test( 'Success', ( assert ) => {
	const obj = {
		Z1K1: 'Z9',
		Z9K1: 'Z100'
	};
	const z1 = Z1Builder.fromNormalJSON( obj ).build();
	assert.deepEqual( z1.normalJSON, obj );
} );

QUnit.test( 'Fail', ( assert ) => {
	const obj = {
		Z1K1: 'Z9'
	};
	assert.throws(
		() => Z1Builder.fromNormalJSON( obj ).build()
	);
} );
