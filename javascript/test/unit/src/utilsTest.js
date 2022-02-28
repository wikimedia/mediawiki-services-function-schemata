'use strict';

const { isKey, isZid, isGlobalKey, makeTrue, makeFalse, makeUnit, makeResultEnvelope, convertArrayToZList, arrayToZ10, convertZListToArray, inferType } = require( '../../../src/utils.js' );

QUnit.module( 'utils.js' );

QUnit.test( 'convertArrayToZList with empty array, canonical', async ( assert ) => {
	const array = [];
	const expected = {
		Z1K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z881',
			Z881K1: 'Z1'
		}
	};
	assert.deepEqual( expected, await convertArrayToZList( array, /* canonical= */true ) );
} );

QUnit.test( 'convertArrayToZList with empty array', async ( assert ) => {
	const array = [];
	const expected = {
		Z1K1: {
			Z1K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z7'
			},
			Z7K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z881'
			},
			Z881K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z1'
			}
		}
	};
	assert.deepEqual( expected, await convertArrayToZList( array ) );
} );

QUnit.test( 'convertArrayToZList with multiple types', async ( assert ) => {
	const array = [
		{
			Z1K1: 'Z6',
			Z6K1: 'strang'
		},
		{
			Z1K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z39'
			},
			Z39K1: {
				Z1K1: 'Z6',
				Z6K1: 'stronk'
			}
		}
	];
	const listZ1K1 = {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z7'
		},
		Z7K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z881'
		},
		Z881K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z1'
		}
	};
	const expected = {
		Z1K1: listZ1K1,
		K1: array[ 0 ],
		K2: {
			Z1K1: listZ1K1,
			K1: array[ 1 ],
			K2: {
				Z1K1: listZ1K1
			}
		}
	};
	assert.deepEqual( expected, await convertArrayToZList( array ) );
} );

QUnit.test( 'convertArrayToZList with single type', async ( assert ) => {
	const array = [
		{
			Z1K1: 'Z6',
			Z6K1: 'stink'
		},
		{
			Z1K1: 'Z6',
			Z6K1: 'stonk'
		}
	];
	const listZ1K1 = {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z7'
		},
		Z7K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z881'
		},
		Z881K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z6'
		}
	};
	const expected = {
		Z1K1: listZ1K1,
		K1: array[ 0 ],
		K2: {
			Z1K1: listZ1K1,
			K1: array[ 1 ],
			K2: {
				Z1K1: listZ1K1
			}
		}
	};
	assert.deepEqual( expected, await convertArrayToZList( array ) );
} );

QUnit.test( 'arrayToZ10', ( assert ) => {
	const array = [
		{
			Z1K1: 'Z6',
			Z6K1: 'stank'
		}
	];
	const listZ1K1 = {
		Z1K1: 'Z9',
		Z9K1: 'Z10'
	};
	const expected = {
		Z1K1: listZ1K1,
		Z10K1: array[ 0 ],
		Z10K2: {
			Z1K1: listZ1K1
		}
	};
	assert.deepEqual( expected, arrayToZ10( array ) );
} );

QUnit.test( 'convertZListToArray with Z10', ( assert ) => {
	const expected = [
		{
			Z1K1: 'Z6',
			Z6K1: 'stank'
		}
	];
	const listZ1K1 = {
		Z1K1: 'Z9',
		Z9K1: 'Z10'
	};
	const Z10 = {
		Z1K1: listZ1K1,
		Z10K1: expected[ 0 ],
		Z10K2: {
			Z1K1: listZ1K1
		}
	};
	assert.deepEqual( expected, convertZListToArray( Z10 ) );
} );

QUnit.test( 'convertZListToArray with Typed List', ( assert ) => {
	const expected = [
		{
			Z1K1: 'Z6',
			Z6K1: 'stink'
		},
		{
			Z1K1: 'Z6',
			Z6K1: 'stonk'
		}
	];
	const listZ1K1 = {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z7'
		},
		Z7K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z881'
		},
		Z881K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z6'
		}
	};
	const ZList = {
		Z1K1: listZ1K1,
		K1: expected[ 0 ],
		K2: {
			Z1K1: listZ1K1,
			K1: expected[ 1 ],
			K2: {
				Z1K1: listZ1K1
			}
		}
	};
	assert.deepEqual( expected, convertZListToArray( ZList ) );
} );

QUnit.test( 'isZid', async ( assert ) => {
	const testValues = [
		{ value: '', isKey: false, isZid: false, isGlobalKey: false, message: 'Empty string' },

		{ value: 'Z1', isKey: false, isZid: true, isGlobalKey: false, message: 'Trivial ZID' },
		{ value: 'Z123', isKey: false, isZid: true, isGlobalKey: false, message: 'Simple ZID' },
		{ value: 'Z01', isKey: false, isZid: false, isGlobalKey: false, message: 'Zero-padded ZID' },
		{ value: 'Z1234567890', isKey: false, isZid: true, isGlobalKey: false, message: 'Long ZID' },
		{ value: ' \tZ1  \n ', isKey: false, isZid: false, isGlobalKey: false, message: 'Whitespace-beset ZID' },
		{ value: 'Z', isKey: false, isZid: false, isGlobalKey: false, message: 'Partial ZID' },

		{ value: 'Z1K1', isKey: true, isZid: false, isGlobalKey: true, message: 'Trivial global key' },
		{ value: 'Z123K1', isKey: true, isZid: false, isGlobalKey: true, message: 'Simple global key' },
		{ value: 'Z1234567890K1234567890', isKey: true, isZid: false, isGlobalKey: true, message: 'Long global key' },
		{ value: 'Z01K1', isKey: false, isZid: false, isGlobalKey: false, message: 'Zero-padded global key' },
		{ value: ' \tZ1K1  \n ', isKey: false, isZid: false, isGlobalKey: false, message: 'Whitespace-beset global key' },
		{ value: 'ZK1', isKey: false, isZid: false, isGlobalKey: false, message: 'Partial ZID global key' },
		{ value: 'Z1K', isKey: false, isZid: false, isGlobalKey: false, message: 'Partial key global key' },

		{ value: 'K1', isKey: true, isZid: false, isGlobalKey: false, message: 'Trivial local key' },
		{ value: 'K123', isKey: true, isZid: false, isGlobalKey: false, message: 'Simple local key' },
		{ value: 'K1234567890', isKey: true, isZid: false, isGlobalKey: false, message: 'Long local key' },
		{ value: 'K01', isKey: false, isZid: false, isGlobalKey: false, message: 'Zero-padded local key' },
		{ value: ' \tK1  \n ', isKey: false, isZid: false, isGlobalKey: false, message: 'Whitespace-beset local key' },
		{ value: 'K', isKey: false, isZid: false, isGlobalKey: false, message: 'Partial local key' }
	];

	testValues.forEach( ( testRun ) => {
		assert.strictEqual( isKey( testRun.value ), testRun.isKey, testRun.message + ': isKey' );
		assert.strictEqual( isZid( testRun.value ), testRun.isZid, testRun.message + ': isZid' );
		assert.strictEqual( isGlobalKey( testRun.value ), testRun.isGlobalKey, testRun.message + ': isGlobalKey' );
	} );
} );

QUnit.test( 'make* functions', async ( assert ) => {
	assert.deepEqual( makeTrue(), { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z40' }, Z40K1: { Z1K1: 'Z9', Z9K1: 'Z41' } } );
	assert.deepEqual( makeFalse(), { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z40' }, Z40K1: { Z1K1: 'Z9', Z9K1: 'Z42' } } );

	assert.deepEqual( makeUnit(), { Z1K1: 'Z9', Z9K1: 'Z23' } );
	assert.deepEqual( makeUnit( false ), { Z1K1: 'Z9', Z9K1: 'Z23' } );
	assert.deepEqual( makeUnit( true ), 'Z23' );

	assert.deepEqual( makeResultEnvelope( null, null, true ), { Z1K1: 'Z22', Z22K1: 'Z23', Z22K2: 'Z23' } );
	assert.deepEqual( makeResultEnvelope( null, null, false ), { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z23' }, Z22K2: { Z1K1: 'Z9', Z9K1: 'Z23' } } );
	assert.deepEqual( makeResultEnvelope( null, null ), { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z23' }, Z22K2: { Z1K1: 'Z9', Z9K1: 'Z23' } } );
} );

QUnit.test( 'inferType', async ( assert ) => {
	assert.deepEqual( inferType( '' ), 'Z6' );
	assert.deepEqual( inferType( 'Z' ), 'Z6' );
	assert.deepEqual( inferType( 'Z0' ), 'Z6' );
	assert.deepEqual( inferType( 'Z1K1' ), 'Z6' );
	assert.deepEqual( inferType( 'Z1' ), 'Z9' );
} );
