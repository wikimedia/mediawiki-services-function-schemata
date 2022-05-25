'use strict';

const {
	arrayToZ10,
	convertArrayToZList,
	convertArrayToKnownTypedList,
	convertZListToArray,
	isString,
	isArray,
	isObject,
	isKey,
	isZid,
	isReference,
	isGlobalKey,
	deepEqual,
	deepCopy,
	// getHead,
	// getTail,
	getTypedListType,
	inferType,
	// isEmptyZList,
	// isUserDefined,
	kidFromGlobalKey,
	makeFalse,
	makeResultEnvelopeWithVoid,
	makeMappedResultEnvelope,
	makeTrue,
	makeVoid,
	isVoid,
	// wrapInKeyReference,
	// wrapInQuote,
	// wrapInZ6,
	// wrapInZ9,
	makeEmptyZMap,
	isZMap,
	setZMapValue,
	getZMapValue,
	maybeUpgradeResultEnvelope,
	maybeDowngradeResultEnvelope,
	getError
} = require( '../../../src/utils.js' );

QUnit.module( 'utils.js' );

QUnit.test( 'is*', async ( assert ) => {
	assert.strictEqual( isString(), false );
	assert.strictEqual( isArray(), false );
	assert.strictEqual( isObject(), false );

	assert.strictEqual( isString( null ), false );
	assert.strictEqual( isArray( null ), false );
	assert.strictEqual( isObject( null ), false );

	assert.strictEqual( isString( '' ), true );
	assert.strictEqual( isArray( '' ), false );
	assert.strictEqual( isObject( '' ), false );

	assert.strictEqual( isString( [] ), false );
	assert.strictEqual( isArray( [] ), true );
	assert.strictEqual( isObject( [] ), false );

	assert.strictEqual( isString( {} ), false );
	assert.strictEqual( isArray( {} ), false );
	assert.strictEqual( isObject( {} ), true );
} );

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

QUnit.test( 'convertArrayToZList with function call types', async ( assert ) => {
	const array = [
		{
			Z1K1: {
				Z1K1: {
					Z1K1: 'Z9',
					Z9K1: 'Z7'
				},
				Z7K1: {
					Z1K1: 'Z9',
					Z9K1: 'Z8888'
				}
			},
			K1: 'strink'
		},
		{
			Z1K1: {
				Z1K1: {
					Z1K1: 'Z9',
					Z9K1: 'Z7'
				},
				Z7K1: {
					Z1K1: 'Z9',
					Z9K1: 'Z8888'
				}
			},
			K1: 'stronk'
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
			Z1K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z7'
			},
			Z7K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z8888'
			}
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

QUnit.test( 'convertArrayToZList with canonical function call types', async ( assert ) => {
	const array = [
		{
			Z1K1: {
				Z1K1: 'Z7',
				Z7K1: 'Z8888',
				Z8888K1: 'some arg'
			},
			K1: 'strink'
		},
		{
			Z1K1: {
				Z1K1: 'Z7',
				Z7K1: 'Z8888',
				Z8888K1: 'some arg'
			},
			K1: 'stronk'
		}
	];
	const listZ1K1 = {
		Z1K1: 'Z7',
		Z7K1: 'Z881',
		Z881K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z8888',
			Z8888K1: 'some arg'
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
	assert.deepEqual( expected, await convertArrayToZList( array, /* canonical */true ) );
} );

QUnit.test( 'convertArrayToKnownTypedLists canonical with string type', ( assert ) => {
	const array = [ 'list of', 'strings' ];
	const listZ1K1 = {
		Z1K1: 'Z7',
		Z7K1: 'Z881',
		Z881K1: 'Z6'
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
	assert.deepEqual( expected, convertArrayToKnownTypedList( array, 'Z6', /* canonical */true ) );
} );

QUnit.test( 'convertArrayToKnownTypedLists normal with string type', ( assert ) => {
	const array = [ { Z1K1: 'Z6', Z6K1: 'list of' }, { Z1K1: 'Z6', Z6K1: 'strings' } ];
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
	assert.deepEqual( expected, convertArrayToKnownTypedList( array, 'Z6' ) );
} );

QUnit.test( 'getTypedListType return canonical with canonical reference', ( assert ) => {
	const elementType = 'Z6';
	const expected = {
		Z1K1: 'Z7',
		Z7K1: 'Z881',
		Z881K1: 'Z6'
	};
	assert.deepEqual( expected, getTypedListType( elementType, true ) );
} );

QUnit.test( 'getTypedListType return canonical with normal reference', ( assert ) => {
	const elementType = {
		Z1K1: 'Z9',
		Z9K1: 'Z6'
	};
	const expected = {
		Z1K1: 'Z7',
		Z7K1: 'Z881',
		Z881K1: 'Z6'
	};
	assert.deepEqual( expected, getTypedListType( elementType, true ) );
} );

QUnit.test( 'getTypedListType return normal with canonical reference', ( assert ) => {
	const elementType = 'Z6';
	const expected = {
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
	assert.deepEqual( expected, getTypedListType( elementType ) );
} );

QUnit.test( 'getTypedListType return normal with normal reference', ( assert ) => {
	const elementType = {
		Z1K1: 'Z9',
		Z9K1: 'Z6'
	};
	const expected = {
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
	assert.deepEqual( expected, getTypedListType( elementType ) );
} );

QUnit.test( 'getTypedListType with canonical function call', ( assert ) => {
	const elementType = {
		Z1K1: 'Z7',
		Z7K1: 'Z885',
		Z885K1: 'Z500'
	};
	const expected = {
		Z1K1: 'Z7',
		Z7K1: 'Z881',
		Z881K1: elementType
	};
	assert.deepEqual( expected, getTypedListType( elementType, true ) );
} );

QUnit.test( 'getTypedListType with normal function call', ( assert ) => {
	const elementType = {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z7'
		},
		Z7K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z8888'
		}
	};
	const expected = {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z7'
		},
		Z7K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z881'
		},
		Z881K1: {
			Z1K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z7'
			},
			Z7K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z8888'
			}
		}
	};
	assert.deepEqual( expected, getTypedListType( elementType ) );
} );

QUnit.test( 'arrayToZ10', ( assert ) => {
	const array = [
		{
			Z1K1: 'Z6',
			Z6K1: 'stank'
		}
	];
	const listZ1K1 = { Z1K1: 'Z9', Z9K1: 'Z10' };
	assert.deepEqual(
		arrayToZ10( array ),
		{ Z1K1: listZ1K1, Z10K1: array[ 0 ], Z10K2: { Z1K1: listZ1K1 } }
	);
	assert.deepEqual(
		arrayToZ10( array, true ),
		{ Z1K1: 'Z10', Z10K1: array[ 0 ], Z10K2: { Z1K1: 'Z10' } }
	);
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

QUnit.test( 'convertZListToArray with undefined', ( assert ) => {
	assert.deepEqual( [], convertZListToArray( undefined ) );
} );

QUnit.test( 'isZid', async ( assert ) => {
	const testValues = [
		{ value: '', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Empty string' },

		{ value: 'Z1', isKey: false, isZid: true, isGlobalKey: false, isReference: true, message: 'Trivial ZID' },
		{ value: 'Z123', isKey: false, isZid: true, isGlobalKey: false, isReference: true, message: 'Simple ZID' },
		{ value: 'Z01', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Zero-padded ZID' },
		{ value: 'Z1234567890', isKey: false, isZid: true, isGlobalKey: false, isReference: true, message: 'Long ZID' },
		{ value: ' \tZ1  \n ', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Whitespace-beset ZID' },
		{ value: 'Z', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Partial ZID' },

		{ value: 'Z1K1', isKey: true, isZid: false, isGlobalKey: true, isReference: false, message: 'Trivial global key' },
		{ value: 'Z123K1', isKey: true, isZid: false, isGlobalKey: true, isReference: false, message: 'Simple global key' },
		{ value: 'Z1234567890K1234567890', isKey: true, isZid: false, isGlobalKey: true, isReference: false, message: 'Long global key' },
		{ value: 'Z01K1', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Zero-padded global key' },
		{ value: ' \tZ1K1  \n ', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Whitespace-beset global key' },
		{ value: 'ZK1', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Partial ZID global key' },
		{ value: 'Z1K', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Partial key global key' },

		{ value: 'A1', isKey: false, isZid: false, isGlobalKey: false, isReference: true, message: 'Trivial non-Wikifunctions ID' },
		{ value: 'A123', isKey: false, isZid: false, isGlobalKey: false, isReference: true, message: 'Simple non-Wikifunctions ID' },
		{ value: 'A1234567890', isKey: false, isZid: false, isGlobalKey: false, isReference: true, message: 'Long non-Wikifunctions ID' },
		{ value: 'A01', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Zero-padded non-Wikifunctions ID' },
		{ value: ' \tA1  \n ', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Whitespace-beset non-Wikifunctions ID' },
		{ value: 'A', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Partial non-Wikifunctions ID' },

		{ value: 'K1', isKey: true, isZid: false, isGlobalKey: false, isReference: false, message: 'Trivial local key' },
		{ value: 'K123', isKey: true, isZid: false, isGlobalKey: false, isReference: false, message: 'Simple local key' },
		{ value: 'K1234567890', isKey: true, isZid: false, isGlobalKey: false, isReference: false, message: 'Long local key' },
		{ value: 'K01', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Zero-padded local key' },
		{ value: ' \tK1  \n ', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Whitespace-beset local key' },
		{ value: 'K', isKey: false, isZid: false, isGlobalKey: false, isReference: false, message: 'Partial local key' }
	];

	testValues.forEach( ( testRun ) => {
		assert.strictEqual( isKey( testRun.value ), testRun.isKey, testRun.message + ': isKey' );
		assert.strictEqual( isZid( testRun.value ), testRun.isZid, testRun.message + ': isZid' );
		assert.strictEqual( isGlobalKey( testRun.value ), testRun.isGlobalKey, testRun.message + ': isGlobalKey' );
		assert.strictEqual( isReference( testRun.value ), testRun.isReference, testRun.message + ': isReference' );
	} );
} );

QUnit.test( 'deepEqual and deepCopy', ( assert ) => {
	assert.strictEqual( deepEqual( deepCopy( [ undefined ] ), [ undefined ] ), true );
} );

const mapType1 = {
	Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
	Z7K1: { Z1K1: 'Z9', Z9K1: 'Z883' },
	Z883K1: { Z1K1: 'Z9', Z9K1: 'Z6' },
	Z883K2: { Z1K1: 'Z9', Z9K1: 'Z1' }
};
const listType1 = {
	Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
	Z7K1: { Z1K1: 'Z9', Z9K1: 'Z881' },
	Z881K1: {
		Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
		Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' },
		Z882K1: { Z1K1: 'Z9', Z9K1: 'Z6' },
		Z882K2: { Z1K1: 'Z9', Z9K1: 'Z1' }
	}
};
const pairType1 = {
	Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
	Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' },
	Z882K1: { Z1K1: 'Z9', Z9K1: 'Z6' },
	Z882K2: { Z1K1: 'Z9', Z9K1: 'Z1' }
};
const error1 = {
	Z1K1: 'Z5',
	Z5K1: {
		Z1K1: 'Z507',
		Z507K1: 'Could not dereference Z7K1'
	}
};
const bogusMapType = {
	Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
	Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' },
	Z883K1: { Z1K1: 'Z9', Z9K1: 'Z6' },
	Z883K2: { Z1K1: 'Z9', Z9K1: 'Z1' }
};

QUnit.test( 'isZMap', async ( assert ) => {
	const emptyZMap = { Z1K1: mapType1, K1: { Z1K1: listType1 } };
	const singletonZMap = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'warnings' }, K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' } },
			K2: { Z1K1: listType1 } } };
	const doubletonZMap = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'warnings' }, K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' } },
			K2: { Z1K1: listType1,
				K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'errors' }, K2: error1 },
				K2: { Z1K1: listType1 } } } };
	const bogusZMap = { Z1K1: bogusMapType, K1: { Z1K1: listType1 } };
	assert.strictEqual( isZMap( emptyZMap ), true );
	assert.strictEqual( isZMap( singletonZMap ), true );
	assert.strictEqual( isZMap( doubletonZMap ), true );
	assert.strictEqual( isZMap( bogusZMap ), false );
} );

QUnit.test( 'getZMapValue', async ( assert ) => {
	const emptyZMap = { Z1K1: mapType1, K1: { Z1K1: listType1 } };
	const singletonZMap = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'warnings' }, K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' } },
			K2: { Z1K1: listType1 } } };
	const doubletonZMap = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'warnings' }, K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' } },
			K2: { Z1K1: listType1,
				K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'errors' }, K2: error1 },
				K2: { Z1K1: listType1 } } } };
	assert.strictEqual( getZMapValue( emptyZMap, { Z1K1: 'Z6', Z6K1: 'warnings' } ), undefined );
	assert.deepEqual( getZMapValue( singletonZMap, { Z1K1: 'Z6', Z6K1: 'warnings' } ), { Z1K1: 'Z6', Z6K1: 'Be warned!' } );
	assert.deepEqual( getZMapValue( doubletonZMap, { Z1K1: 'Z6', Z6K1: 'errors' } ), error1 );

	// Double-check that trying to get a ZMapValue on undefined returns undefined.
	assert.strictEqual(
		getZMapValue( undefined, { Z1K1: 'Z6', Z6K1: 'warnings' } ),
		undefined
	);
} );

QUnit.test( 'setZMapValue', async ( assert ) => {
	const emptyZMap = { Z1K1: mapType1, K1: { Z1K1: listType1 } };
	const singletonZMap = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'warnings' }, K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' } },
			K2: { Z1K1: listType1 } } };
	const modifiedSingletonZMap = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1,
				K1: { Z1K1: 'Z6', Z6K1: 'warnings' },
				K2: { Z1K1: 'Z6', Z6K1: 'Relax, but this is still a warning' } },
			K2: { Z1K1: listType1 } } };
	assert.deepEqual( setZMapValue( emptyZMap, { Z1K1: 'Z6', Z6K1: 'warnings' }, { Z1K1: 'Z6', Z6K1: 'Be warned!' } ),
		singletonZMap );
	assert.deepEqual( setZMapValue( singletonZMap, { Z1K1: 'Z6', Z6K1: 'warnings' }, { Z1K1: 'Z6', Z6K1: 'Relax, but this is still a warning' } ),
		modifiedSingletonZMap );

	// Double-check that trying to set a ZMapValue on undefined returns undefined.
	assert.strictEqual(
		setZMapValue( undefined, { Z1K1: 'Z6', Z6K1: 'warnings' }, { Z1K1: 'Z6', Z6K1: 'Be warned!' } ),
		undefined
	);
} );

QUnit.test( 'make* functions', async ( assert ) => {
	const singletonZMapErrorsOnly = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'errors' }, K2: error1 },
			K2: { Z1K1: listType1 } } };
	const mappedResultEnvelopeErrorsOnly = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: singletonZMapErrorsOnly };
	assert.deepEqual( makeTrue(), { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z40' }, Z40K1: { Z1K1: 'Z9', Z9K1: 'Z41' } } );
	assert.deepEqual( makeFalse(), { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z40' }, Z40K1: { Z1K1: 'Z9', Z9K1: 'Z42' } } );

	assert.deepEqual( makeVoid(), { Z1K1: 'Z9', Z9K1: 'Z24' } );
	assert.deepEqual( makeVoid( false ), { Z1K1: 'Z9', Z9K1: 'Z24' } );
	assert.deepEqual( makeVoid( true ), 'Z24' );

	assert.deepEqual( makeResultEnvelopeWithVoid( null, null, true ), { Z1K1: 'Z22', Z22K1: 'Z24', Z22K2: 'Z24' } );
	assert.deepEqual( makeResultEnvelopeWithVoid( null, null, false ), { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: { Z1K1: 'Z9', Z9K1: 'Z24' } } );
	assert.deepEqual( makeResultEnvelopeWithVoid( null, null ), { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: { Z1K1: 'Z9', Z9K1: 'Z24' } } );

	assert.deepEqual( makeMappedResultEnvelope( null, null, true ), { Z1K1: 'Z22', Z22K1: 'Z24', Z22K2: 'Z24' } );
	assert.deepEqual( makeMappedResultEnvelope( null, null, false ), { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: { Z1K1: 'Z9', Z9K1: 'Z24' } } );
	assert.deepEqual( makeMappedResultEnvelope( null, null ), { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: { Z1K1: 'Z9', Z9K1: 'Z24' } } );
	assert.deepEqual( makeMappedResultEnvelope( null, singletonZMapErrorsOnly ),
		mappedResultEnvelopeErrorsOnly );
	assert.deepEqual( makeMappedResultEnvelope( null, error1 ), mappedResultEnvelopeErrorsOnly );

	assert.deepEqual( makeEmptyZMap( { Z1K1: 'Z9', Z9K1: 'Z6' }, { Z1K1: 'Z9', Z9K1: 'Z1' } ), {
		Z1K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z883' }, Z883K1: { Z1K1: 'Z9', Z9K1: 'Z6' }, Z883K2: { Z1K1: 'Z9', Z9K1: 'Z1' } },
		K1: { Z1K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z881' }, Z881K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' }, Z882K1: { Z1K1: 'Z9', Z9K1: 'Z6' }, Z882K2: { Z1K1: 'Z9', Z9K1: 'Z1' } } } }
	} );
	assert.deepEqual( makeEmptyZMap( { Z1K1: 'Z9', Z9K1: 'Z39' }, { Z1K1: 'Z9', Z9K1: 'Z5' } ), {
		Z1K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z883' }, Z883K1: { Z1K1: 'Z9', Z9K1: 'Z39' }, Z883K2: { Z1K1: 'Z9', Z9K1: 'Z5' } },
		K1: { Z1K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z881' }, Z881K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' }, Z882K1: { Z1K1: 'Z9', Z9K1: 'Z39' }, Z882K2: { Z1K1: 'Z9', Z9K1: 'Z5' } } } }
	} );
	assert.deepEqual( makeEmptyZMap( { Z1K1: 'Z9', Z9K1: 'Z6' }, listType1 ), {
		Z1K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z883' }, Z883K1: { Z1K1: 'Z9', Z9K1: 'Z6' }, Z883K2: listType1 },
		K1: { Z1K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z881' }, Z881K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' }, Z882K1: { Z1K1: 'Z9', Z9K1: 'Z6' }, Z882K2: listType1 } } }
	} );
	assert.deepEqual( makeEmptyZMap( { Z1K1: 'Z9', Z9K1: 'Z6' }, mapType1 ), {
		Z1K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z883' }, Z883K1: { Z1K1: 'Z9', Z9K1: 'Z6' }, Z883K2: mapType1 },
		K1: { Z1K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z881' }, Z881K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' }, Z882K1: { Z1K1: 'Z9', Z9K1: 'Z6' }, Z882K2: mapType1 } } }
	} );

	// Double-check that trying to make a Map from an unsupported key type returns undefined.
	assert.strictEqual( makeEmptyZMap( { Z1K1: 'Z9', Z9K1: 'Z41' }, { Z1K1: 'Z9', Z9K1: 'Z1' } ), undefined );

} );

QUnit.test( 'isVoid', async ( assert ) => {
	assert.strictEqual( isVoid( [] ), false );
	assert.strictEqual( isVoid( '' ), false );
	assert.strictEqual( isVoid( 'z24' ), false );
	assert.strictEqual( isVoid( 'Z24' ), true );
	assert.strictEqual( isVoid( {} ), false );
	assert.strictEqual( isVoid( { Z1K1: '' } ), false );
	assert.strictEqual( isVoid( { Z1K1: 'Z9' } ), false );
	assert.strictEqual( isVoid( { Z1K1: 'Z9', Z9K1: '' } ), false );
	assert.strictEqual( isVoid( { Z1K1: 'Z9', Z9K1: 'z24' } ), false );
	assert.strictEqual( isVoid( { Z1K1: 'Z9', Z9K1: 'Z24' } ), true );
} );

QUnit.test( 'maybeUpgradeResultEnvelope', async ( assert ) => {
	const singletonZMapErrorsOnly = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'errors' }, K2: error1 },
			K2: { Z1K1: listType1 } } };
	const basicResultEnvelopeErrorsOnly = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: error1 };
	const mappedResultEnvelopeErrorsOnly = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: singletonZMapErrorsOnly };
	const emptyResultEnvelope = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: { Z1K1: 'Z9', Z9K1: 'Z24' } };
	assert.strictEqual( maybeUpgradeResultEnvelope( mappedResultEnvelopeErrorsOnly ),
		mappedResultEnvelopeErrorsOnly );
	assert.strictEqual( maybeUpgradeResultEnvelope( emptyResultEnvelope ), emptyResultEnvelope );
	assert.deepEqual( maybeUpgradeResultEnvelope( basicResultEnvelopeErrorsOnly ),
		mappedResultEnvelopeErrorsOnly );

	// Double-check that trying to upgrade undefined returns undefined.
	assert.strictEqual( maybeUpgradeResultEnvelope( undefined ), undefined );
} );

QUnit.test( 'maybeDowngradeResultEnvelope', async ( assert ) => {
	const singletonZMapErrorsOnly = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'errors' }, K2: error1 },
			K2: { Z1K1: listType1 } } };
	const emptyResultEnvelope = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: { Z1K1: 'Z9', Z9K1: 'Z24' } };
	const doubletonZMap = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'warnings' }, K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' } },
			K2: { Z1K1: listType1,
				K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'errors' }, K2: error1 },
				K2: { Z1K1: listType1 } } } };
	const basicResultEnvelopeErrorsOnly = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: error1 };
	const mappedResultEnvelopeErrorsOnly = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: singletonZMapErrorsOnly };
	const mappedResultEnvelope2Entries = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: doubletonZMap };
	assert.deepEqual( maybeDowngradeResultEnvelope( { Z1K1: 'Z22', Z22K1: 'Z24', Z22K2: 'Z24' } ), { Z1K1: 'Z22', Z22K1: 'Z24', Z22K2: 'Z24' } );
	assert.deepEqual( maybeDowngradeResultEnvelope( emptyResultEnvelope ), emptyResultEnvelope );
	assert.deepEqual( maybeDowngradeResultEnvelope( mappedResultEnvelopeErrorsOnly ),
		basicResultEnvelopeErrorsOnly );
	assert.deepEqual( maybeDowngradeResultEnvelope( mappedResultEnvelope2Entries ),
		basicResultEnvelopeErrorsOnly );

	// Double-check that trying to downgrade undefined returns undefined.
	assert.strictEqual( maybeDowngradeResultEnvelope( undefined ), undefined );

	// If the mapped ResultEnvelope has an errors key but no value, it should be a void
	const mappedResultEnvelopeEmptyErrors = {
		Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' },
		Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' },
		Z22K2: {
			Z1K1: mapType1,
			K1: {
				Z1K1: listType1,
				K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'errors' } },
				K2: { Z1K1: listType1 }
			}
		}
	};
	const unmappedResultEnvelopeEmptyErrors = {
		Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' },
		Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' },
		Z22K2: { Z1K1: 'Z9', Z9K1: 'Z24' }
	};
	assert.deepEqual(
		maybeDowngradeResultEnvelope( mappedResultEnvelopeEmptyErrors ),
		unmappedResultEnvelopeEmptyErrors
	);
} );

QUnit.test( 'getError', async ( assert ) => {
	const singletonZMapErrorsOnly = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'errors' }, K2: error1 },
			K2: { Z1K1: listType1 } } };
	const mappedResultEnvelopeErrorsOnly = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: singletonZMapErrorsOnly };
	const emptyZMap = { Z1K1: mapType1, K1: { Z1K1: listType1 } };
	const mappedResultEnvelopeNoEntries = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: emptyZMap };
	const singletonZMap = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'warnings' }, K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' } },
			K2: { Z1K1: listType1 } } };
	const mappedResultEnvelopeWithWarnings = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: singletonZMap };
	const doubletonZMap = { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'warnings' }, K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' } },
			K2: { Z1K1: listType1,
				K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'errors' }, K2: error1 },
				K2: { Z1K1: listType1 } } } };
	const basicResultEnvelope = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: error1 };
	const mappedResultEnvelope2Entries = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: doubletonZMap };
	assert.strictEqual( getError( mappedResultEnvelopeErrorsOnly ), error1 );
	assert.strictEqual( getError( mappedResultEnvelope2Entries ), error1 );
	assert.strictEqual( getError( basicResultEnvelope ), error1 );
	assert.deepEqual( getError( mappedResultEnvelopeNoEntries ), { Z1K1: 'Z9', Z9K1: 'Z24' } );
	assert.deepEqual( getError( mappedResultEnvelopeWithWarnings ), { Z1K1: 'Z9', Z9K1: 'Z24' } );
} );

QUnit.test( 'inferType', async ( assert ) => {
	assert.deepEqual( inferType( '' ), 'Z6' );
	assert.deepEqual( inferType( 'Z' ), 'Z6' );
	assert.deepEqual( inferType( 'Z0' ), 'Z6' );
	assert.deepEqual( inferType( 'Z1K1' ), 'Z6' );
	assert.deepEqual( inferType( 'Z1' ), 'Z9' );
	assert.deepEqual( inferType( [ 'Z1' ] ), 'LIST' );
	assert.deepEqual( inferType( { Z1K1: 'Z1' } ), 'Z1' );
} );

QUnit.test( 'kidFromGlobalKey', async ( assert ) => {
	assert.strictEqual( kidFromGlobalKey( 'Z1K1' ), 'K1' );
	assert.strictEqual( kidFromGlobalKey( 'Z1K123' ), 'K123' );
	assert.strictEqual( kidFromGlobalKey( 'Z1K1234567890' ), 'K1234567890' );
	assert.strictEqual( kidFromGlobalKey( 'Z123K1' ), 'K1' );
	assert.strictEqual( kidFromGlobalKey( 'Z123K123' ), 'K123' );
	assert.strictEqual( kidFromGlobalKey( 'Z123K1234567890' ), 'K1234567890' );
	assert.strictEqual( kidFromGlobalKey( 'Z1234567890K1' ), 'K1' );
	assert.strictEqual( kidFromGlobalKey( 'Z1234567890K123' ), 'K123' );
	assert.strictEqual( kidFromGlobalKey( 'Z1234567890K1234567890' ), 'K1234567890' );
} );
