'use strict';

const errorFormatter = require( '../../../src/errorFormatter.js' );

QUnit.module( 'errorFormatter' );

QUnit.test( 'createZErrorInstance: Undefined error type', ( assert ) => {
	assert.throws(
		() => { errorFormatter.createZErrorInstance(); },
		( err ) => err.toString().includes( 'Invalid error type' )
	);
} );

QUnit.test( 'createZErrorInstance: Wrong error type', ( assert ) => {
	assert.throws(
		() => { errorFormatter.createZErrorInstance( true ); },
		( err ) => err.toString().includes( 'Invalid error type' )
	);
} );

QUnit.test( 'createZErrorInstance: Wrong error zid', ( assert ) => {
	assert.throws(
		() => { errorFormatter.createZErrorInstance( 'soup' ); },
		( err ) => err.toString().includes( 'Invalid error type' )
	);
} );

QUnit.test( 'createZErrorInstance: Not builtin error, no args', ( assert ) => {
	const error = errorFormatter.createZErrorInstance( 'Z999' );
	assert.deepEqual(
		error,
		{
			Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' },
			Z5K1: { Z1K1: 'Z9', Z9K1: 'Z999' },
			Z5K2: {
				Z1K1: {
					Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
					Z7K1: { Z1K1: 'Z9', Z9K1: 'Z885' },
					Z885K1: { Z1K1: 'Z9', Z9K1: 'Z999' }
				}
			}
		}
	);
} );

QUnit.test( 'createZErrorInstance: Not builtin error, with arg', ( assert ) => {
	const error = errorFormatter.createZErrorInstance( 'Z999', { K1: { Z1K1: 'Z9', Z9K1: 'Z666' } } );
	assert.deepEqual(
		error,
		{
			Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' },
			Z5K1: { Z1K1: 'Z9', Z9K1: 'Z999' },
			Z5K2: {
				Z1K1: {
					Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
					Z7K1: { Z1K1: 'Z9', Z9K1: 'Z885' },
					Z885K1: { Z1K1: 'Z9', Z9K1: 'Z999' }
				},
				Z999K1: { Z1K1: 'Z9', Z9K1: 'Z666' }
			}
		}
	);
} );

QUnit.test( 'createZErrorInstance: Not builtin error, with args', ( assert ) => {
	const error = errorFormatter.createZErrorInstance( 'Z999', {
		K1: { Z1K1: 'Z9', Z9K1: 'Z666' }, K2: { Z1K1: 'Z6', Z6K1: 'error msg' }
	} );
	assert.deepEqual(
		error,
		{
			Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' },
			Z5K1: { Z1K1: 'Z9', Z9K1: 'Z999' },
			Z5K2: {
				Z1K1: {
					Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
					Z7K1: { Z1K1: 'Z9', Z9K1: 'Z885' },
					Z885K1: { Z1K1: 'Z9', Z9K1: 'Z999' }
				},
				Z999K1: { Z1K1: 'Z9', Z9K1: 'Z666' },
				Z999K2: { Z1K1: 'Z6', Z6K1: 'error msg' }
			}
		}
	);
} );

QUnit.test( 'createZErrorInstance', ( assert ) => {
	const error = errorFormatter.createZErrorInstance( 'Z502', { subtype: { Z1K1: 'Z9', Z9K1: 'Z526' } } );
	assert.deepEqual(
		error,
		{
			Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' },
			Z5K1: { Z1K1: 'Z9', Z9K1: 'Z502' },
			Z5K2: {
				Z1K1: {
					Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
					Z7K1: { Z1K1: 'Z9', Z9K1: 'Z885' },
					Z885K1: { Z1K1: 'Z9', Z9K1: 'Z502' }
				},
				Z502K1: { Z1K1: 'Z9', Z9K1: 'Z526' }
			}
		}
	);
} );
