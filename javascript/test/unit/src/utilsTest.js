'use strict';

const { convertArrayToZList, arrayToZ10, convertZListToArray } = require( '../../../src/utils.js' );

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
