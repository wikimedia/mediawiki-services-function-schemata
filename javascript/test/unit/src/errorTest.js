'use strict';

const { makeErrorInNormalForm, makeErrorInCanonicalForm } = require( '../../../src/error.js' );

QUnit.module( 'error' );

QUnit.test( 'makeErrorInNormalForm: Undefined throws', ( assert ) => {
	assert.throws(
		() => { makeErrorInNormalForm(); },
		( err ) => err.toString().includes( 'Missing error type' )
	);
} );

QUnit.test( 'makeErrorInCanonicalForm: Undefined throws', ( assert ) => {
	assert.throws(
		() => { makeErrorInCanonicalForm(); },
		( err ) => err.toString().includes( 'Missing error type' )
	);
} );

QUnit.test( 'makeErrorInNormalForm: Non-ZID throws', ( assert ) => {
	assert.throws(
		() => { makeErrorInNormalForm( 'Hello' ); },
		( err ) => err.toString().includes( 'Invalid error type' )
	);
} );

QUnit.test( 'makeErrorInCanonicalForm: Non-ZID throws', ( assert ) => {
	assert.throws(
		() => { makeErrorInCanonicalForm( 'Hello' ); },
		( err ) => err.toString().includes( 'Invalid error type' )
	);
} );

QUnit.test( 'makeErrorInNormalForm: Z500 error, with no args', ( assert ) => {
	const error = makeErrorInNormalForm( 'Z500' );
	assert.deepEqual(
		error,
		{
			Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' },
			Z5K1: { Z1K1: 'Z9', Z9K1: 'Z500' },
			Z5K2: {
				Z1K1: {
					Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
					Z7K1: { Z1K1: 'Z9', Z9K1: 'Z885' },
					Z885K1: { Z1K1: 'Z9', Z9K1: 'Z500' }
				}
			}
		}
	);
} );

QUnit.test( 'makeErrorInCanonicalForm: Z500 error, with no args', ( assert ) => {
	const error = makeErrorInCanonicalForm( 'Z500' );
	assert.deepEqual(
		error,
		{
			Z1K1: 'Z5',
			Z5K1: 'Z500',
			Z5K2: {
				Z1K1: {
					Z1K1: 'Z7',
					Z7K1: 'Z885',
					Z885K1: 'Z500'
				}
			}
		}
	);
} );

QUnit.test( 'makeErrorInNormalForm: Z500 error, with one arg', ( assert ) => {
	const error = makeErrorInNormalForm( 'Z500', [ 'hello' ] );
	assert.deepEqual(
		error,
		{
			Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' },
			Z5K1: { Z1K1: 'Z9', Z9K1: 'Z500' },
			Z5K2: {
				Z1K1: {
					Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
					Z7K1: { Z1K1: 'Z9', Z9K1: 'Z885' },
					Z885K1: { Z1K1: 'Z9', Z9K1: 'Z500' }
				},
				Z500K1: {
					Z1K1: 'Z6',
					Z6K1: 'hello'
				}
			}
		}
	);
} );

QUnit.test( 'makeErrorInCanonicalForm: Z500 error, with one arg', ( assert ) => {
	const error = makeErrorInCanonicalForm( 'Z500', [ 'hello' ] );
	assert.deepEqual(
		error,
		{
			Z1K1: 'Z5',
			Z5K1: 'Z500',
			Z5K2: {
				Z1K1: {
					Z1K1: 'Z7',
					Z7K1: 'Z885',
					Z885K1: 'Z500'
				},
				Z500K1: 'hello'
			}
		}
	);
} );

QUnit.test( 'makeErrorInNormalForm: Z500 error, with two args', ( assert ) => {
	const error = makeErrorInNormalForm( 'Z500', [ 'hello', { Z1K1: 'Z9', Z9K1: 'Z41' } ] );
	assert.deepEqual(
		error,
		{
			Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' },
			Z5K1: { Z1K1: 'Z9', Z9K1: 'Z500' },
			Z5K2: {
				Z1K1: {
					Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
					Z7K1: { Z1K1: 'Z9', Z9K1: 'Z885' },
					Z885K1: { Z1K1: 'Z9', Z9K1: 'Z500' }
				},
				Z500K1: {
					Z1K1: 'Z6',
					Z6K1: 'hello'
				},
				Z500K2: {
					Z1K1: 'Z9',
					Z9K1: 'Z41'
				}
			}
		}
	);
} );

QUnit.test( 'makeErrorInCanonicalForm: Z500 error, with two args', ( assert ) => {
	const error = makeErrorInCanonicalForm( 'Z500', [ 'hello', 'Z41' ] );
	assert.deepEqual(
		error,
		{
			Z1K1: 'Z5',
			Z5K1: 'Z500',
			Z5K2: {
				Z1K1: {
					Z1K1: 'Z7',
					Z7K1: 'Z885',
					Z885K1: 'Z500'
				},
				Z500K1: 'hello',
				Z500K2: 'Z41'
			}
		}
	);
} );
