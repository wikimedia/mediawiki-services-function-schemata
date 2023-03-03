'use strict';

const {
	builtInTypes,
	convertItemArrayToZList,
	convertBenjaminArrayToZList,
	convertArrayToKnownTypedList,
	convertZListToItemArray,
	findIdentity,
	isMemberOfDangerTrio,
	inferItemType,
	isZArgumentReference,
	isZFunctionCall,
	isZReference,
	isZType,
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
	isBuiltInType,
	// isEmptyZList,
	isUserDefined,
	kidFromGlobalKey,
	makeFalse,
	makeMappedResultEnvelope,
	makeTrue,
	makeVoid,
	isVoid,
	// wrapInKeyReference,
	// wrapInQuote,
	// wrapInZ6,
	// wrapInZ9,
	makeEmptyZMap,
	makeEmptyZResponseEnvelopeMap,
	isZMap,
	setZMapValue,
	getZMapValue,
	getError,
	setMetadataValue
} = require( '../../../src/utils.js' );
const canonicalize = require( '../../../src/canonicalize.js' );

QUnit.module( 'utils.js' );

QUnit.test( 'is*', ( assert ) => {
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

QUnit.test( 'built-in types', ( assert ) => {
	for ( const ZID of builtInTypes() ) {
		assert.true( isBuiltInType( ZID ) );
		assert.false( isUserDefined( ZID ) );
	}
} );

QUnit.test( 'convertBenjaminArrayToZList with empty array, canonical', ( assert ) => {
	const array = [ 'Z1' ];
	const expected = {
		Z1K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z881',
			Z881K1: 'Z1'
		}
	};
	assert.deepEqual( convertBenjaminArrayToZList( array, /* canonical= */true ), expected );
} );

QUnit.test( 'convertItemArrayToZList with empty array, canonical', ( assert ) => {
	const array = [];
	const expected = {
		Z1K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z881',
			Z881K1: 'Z1'
		}
	};
	assert.deepEqual( convertItemArrayToZList( array, /* canonical= */true ), expected );
} );

QUnit.test( 'convertBenjaminArrayToZList with empty array, normal', ( assert ) => {
	const array = [ { Z1K1: 'Z9', Z9K1: 'Z1' } ];
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
	assert.deepEqual( convertBenjaminArrayToZList( array ), expected );
} );

QUnit.test( 'convertItemArrayToZList with empty array, normal', ( assert ) => {
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
	assert.deepEqual( convertItemArrayToZList( array ), expected );
} );

QUnit.test( 'convertBenjaminArrayToZList with multiple types', ( assert ) => {
	const array = [
		{
			Z1K1: 'Z9',
			Z9K1: 'Z1'
		},
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
		K1: array[ 1 ],
		K2: {
			Z1K1: listZ1K1,
			K1: array[ 2 ],
			K2: {
				Z1K1: listZ1K1
			}
		}
	};
	assert.deepEqual( convertBenjaminArrayToZList( array ), expected );
} );

QUnit.test( 'convertItemArrayToZList with multiple types', ( assert ) => {
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
	assert.deepEqual( convertItemArrayToZList( array ), expected );
} );

QUnit.test( 'convertBenjaminArrayToZList with single type', ( assert ) => {
	const array = [
		{
			Z1K1: 'Z9',
			Z9K1: 'Z6'
		},
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
		K1: array[ 1 ],
		K2: {
			Z1K1: listZ1K1,
			K1: array[ 2 ],
			K2: {
				Z1K1: listZ1K1
			}
		}
	};
	assert.deepEqual( convertBenjaminArrayToZList( array ), expected );
} );

QUnit.test( 'convertItemArrayToZList with single type', ( assert ) => {
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
	assert.deepEqual( convertItemArrayToZList( array ), expected );
} );

QUnit.test( 'convertBenjaminArrayToZList with function call types', ( assert ) => {
	const array = [
		{
			Z1K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z7'
			},
			Z7K1: {
				Z1K1: 'Z9',
				Z9K1: 'Z8888'
			}
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
		K1: array[ 1 ],
		K2: {
			Z1K1: listZ1K1,
			K1: array[ 2 ],
			K2: {
				Z1K1: listZ1K1
			}
		}
	};
	assert.deepEqual( convertBenjaminArrayToZList( array ), expected );
} );

QUnit.test( 'convertItemArrayToZList with function call types', ( assert ) => {
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
	assert.deepEqual( convertItemArrayToZList( array ), expected );
} );

QUnit.test( 'convertBenjaminArrayToZList with canonical function call types', ( assert ) => {
	const array = [
		{
			Z1K1: 'Z7',
			Z7K1: 'Z8888',
			Z8888K1: 'some arg'
		},
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
		K1: array[ 1 ],
		K2: {
			Z1K1: listZ1K1,
			K1: array[ 2 ],
			K2: {
				Z1K1: listZ1K1
			}
		}
	};
	assert.deepEqual( convertBenjaminArrayToZList( array, /* canonical */true ), expected );
} );

QUnit.test( 'convertItemArrayToZList with canonical function call types', ( assert ) => {
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
	assert.deepEqual( convertItemArrayToZList( array, /* canonical */true ), expected );
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
	assert.deepEqual( convertArrayToKnownTypedList( array, 'Z6', /* canonical */true ), expected );
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
	assert.deepEqual( convertArrayToKnownTypedList( array, 'Z6' ), expected );
} );

QUnit.test( 'getTypedListType return canonical with canonical reference', ( assert ) => {
	const elementType = 'Z6';
	const expected = {
		Z1K1: 'Z7',
		Z7K1: 'Z881',
		Z881K1: 'Z6'
	};
	assert.deepEqual( getTypedListType( elementType, true ), expected );
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
	assert.deepEqual( getTypedListType( elementType, true ), expected );
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
	assert.deepEqual( getTypedListType( elementType ), expected );
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
	assert.deepEqual( getTypedListType( elementType ), expected );
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
	assert.deepEqual( getTypedListType( elementType, true ), expected );
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
	assert.deepEqual( getTypedListType( elementType ), expected );
} );

QUnit.test( 'convertZListToItemArray with Typed List', ( assert ) => {
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
	assert.deepEqual( convertZListToItemArray( ZList ), expected );
} );

QUnit.test( 'convertZListToItemArray with undefined', ( assert ) => {
	assert.deepEqual( convertZListToItemArray( undefined ), [] );
} );

QUnit.test( 'isZid', ( assert ) => {
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
const resolvedMapType = {
	Z1K1: { Z1K1: 'Z9', Z9K1: 'Z4' },
	Z4K1: mapType1,
	Z4K2: {
		Z1K1: {
			Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
			Z7K1: { Z1K1: 'Z9', Z9K1: 'Z881' },
			Z881K1: { Z1K1: 'Z9', Z9K1: 'Z3' }
		}
	},
	Z4K3: { Z1K1: 'Z9', Z9K1: 'Z831' }
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
	Z1K1: { Z1K1: 'Z9', Z9K1: 'Z5' },
	Z5K1: {
		Z1K1: { Z1K1: 'Z9', Z9K1: 'Z507' },
		Z507K1: { Z1K1: 'Z6', Z6K1: 'Could not dereference Z7K1' }
	}
};
const bogusMapType = {
	Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
	Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' },
	Z883K1: { Z1K1: 'Z9', Z9K1: 'Z6' },
	Z883K2: { Z1K1: 'Z9', Z9K1: 'Z1' }
};

QUnit.test( 'isZMap', ( assert ) => {
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
	const ZMapWithResolvedType = {
		Z1K1: resolvedMapType,
		K1: {
			Z1K1: listType1
		}
	};
	const bogusZMap = { Z1K1: bogusMapType, K1: { Z1K1: listType1 } };
	assert.strictEqual( isZMap( emptyZMap ), true );
	assert.strictEqual( isZMap( singletonZMap ), true );
	assert.strictEqual( isZMap( doubletonZMap ), true );
	assert.strictEqual( isZMap( ZMapWithResolvedType ), true );
	assert.strictEqual( isZMap( bogusZMap ), false );
} );

QUnit.test( 'getZMapValue', ( assert ) => {
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
	assert.strictEqual( getZMapValue( singletonZMap, { Z1K1: 'Z6', Z6K1: 'not there' } ), undefined );
	assert.deepEqual( getZMapValue( singletonZMap, { Z1K1: 'Z6', Z6K1: 'warnings' } ), { Z1K1: 'Z6', Z6K1: 'Be warned!' } );
	assert.strictEqual( getZMapValue( doubletonZMap, { Z1K1: 'Z6', Z6K1: 'not there' } ), undefined );
	assert.deepEqual( getZMapValue( doubletonZMap, { Z1K1: 'Z6', Z6K1: 'warnings' } ), { Z1K1: 'Z6', Z6K1: 'Be warned!' } );
	assert.deepEqual( getZMapValue( doubletonZMap, { Z1K1: 'Z6', Z6K1: 'errors' } ), error1 );

	// Double-check that trying to get a ZMapValue on undefined returns undefined.
	assert.strictEqual(
		getZMapValue( undefined, { Z1K1: 'Z6', Z6K1: 'warnings' } ),
		undefined
	);
} );

QUnit.test( 'getZMapValue with (Benjamin) canonical form', ( assert ) => {
	const emptyZMap =
		canonicalize( { Z1K1: mapType1, K1: { Z1K1: listType1 } }, false, true ).Z22K1;
	const singletonZMap = canonicalize( { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'warnings' }, K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' } },
			K2: { Z1K1: listType1 } } }, false, true ).Z22K1;
	const doubletonZMap = canonicalize( { Z1K1: mapType1,
		K1: { Z1K1: listType1,
			K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'warnings' }, K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' } },
			K2: { Z1K1: listType1,
				K1: { Z1K1: pairType1, K1: { Z1K1: 'Z6', Z6K1: 'errors' }, K2: error1 },
				K2: { Z1K1: listType1 } } } }, false, true ).Z22K1;
	assert.strictEqual( getZMapValue( emptyZMap, 'warnings', true ), undefined );
	assert.strictEqual( getZMapValue( singletonZMap, 'not there', true ), undefined );
	assert.deepEqual( getZMapValue( singletonZMap, 'warnings', true ), 'Be warned!' );
	assert.strictEqual( getZMapValue( doubletonZMap, 'not there', true ), undefined );
	assert.deepEqual( getZMapValue( doubletonZMap, 'warnings', true ), 'Be warned!' );
	assert.deepEqual( getZMapValue( doubletonZMap, 'errors', true ),
		canonicalize( error1, false, true ).Z22K1 );

	// Double-check that trying to get a ZMapValue on undefined returns undefined.
	assert.strictEqual(
		getZMapValue( undefined, 'warnings', true ),
		undefined
	);
} );

QUnit.test( 'setZMapValue', ( assert ) => {
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

QUnit.test( 'setZMapValue with resolved type', ( assert ) => {
	// Ensure that type inference works correctly when the ZMap's type has been resolved.
	const ZMapWithResolvedType = {
		Z1K1: resolvedMapType,
		K1: {
			Z1K1: listType1
		}
	};
	const expectedZMap = {
		Z1K1: resolvedMapType,
		K1: {
			Z1K1: listType1,
			K1: {
				Z1K1: pairType1,
				K1: { Z1K1: 'Z6', Z6K1: 'warnings' },
				K2: { Z1K1: 'Z6', Z6K1: 'Be warned!' }
			},
			K2: { Z1K1: listType1 }
		}
	};
	assert.deepEqual(
		setZMapValue(
			ZMapWithResolvedType,
			{ Z1K1: 'Z6', Z6K1: 'warnings' },
			{ Z1K1: 'Z6', Z6K1: 'Be warned!' }
		),
		expectedZMap
	);
} );

QUnit.test( 'setZMapValue with callback', ( assert ) => {
	const emptyZMap = { Z1K1: mapType1, K1: { Z1K1: listType1 } };
	const beWarned = 'Be warned!';
	const dontBeWarned = 'nm, don\'t be warned';

	// Assert that callback should be called with the new tail.
	const expectedTail = {
		Z1K1: listType1,
		K1: {
			Z1K1: pairType1,
			K1: {
				Z1K1: 'Z6',
				Z6K1: 'warnings'
			},
			K2: {
				Z1K1: 'Z6',
				Z6K1: beWarned
			}
		},
		K2: {
			Z1K1: listType1
		}
	};
	const callback = function ( newTail ) {
		assert.deepEqual( newTail, expectedTail );
		const newerTail = { ...newTail };
		newerTail.K1.K2.Z6K1 = dontBeWarned;
		return newerTail;
	};

	// Assert that result is the expected map.
	const expectedZMap = {
		Z1K1: mapType1,
		K1: {
			Z1K1: listType1,
			K1: {
				Z1K1: pairType1,
				K1: {
					Z1K1: 'Z6',
					Z6K1: 'warnings'
				},
				K2: {
					Z1K1: 'Z6',
					Z6K1: dontBeWarned
				}
			},
			K2: {
				Z1K1: listType1
			}
		}
	};
	assert.deepEqual(
		setZMapValue(
			emptyZMap,
			{ Z1K1: 'Z6', Z6K1: 'warnings' },
			{ Z1K1: 'Z6', Z6K1: beWarned },
			callback ),
		expectedZMap
	);
} );

QUnit.test( 'setZMapValue appends to a non-empty list', ( assert ) => {
	function Z6_( someString ) {
		return {
			Z1K1: 'Z6',
			Z6K1: someString
		};
	}
	const emptyZMap = { Z1K1: mapType1, K1: { Z1K1: listType1 } };
	const warningKey = Z6_( 'warnings' );
	const reassuranceKey = Z6_( 'reassurances' );
	const beWarned = Z6_( 'Be warned!' );
	const dontBeWarned = Z6_( 'nm, don\'t be warned' );

	// Assert that result is the expected map.
	const firstExpectedZMap = {
		Z1K1: mapType1,
		K1: {
			Z1K1: listType1,
			K1: {
				Z1K1: pairType1,
				K1: warningKey,
				K2: beWarned
			},
			K2: {
				Z1K1: listType1
			}
		}
	};
	const firstResult = setZMapValue( emptyZMap, warningKey, beWarned );
	assert.deepEqual(
		firstResult, firstExpectedZMap
	);

	// Do it again.
	const secondExpectedZMap = {
		Z1K1: mapType1,
		K1: {
			Z1K1: listType1,
			K1: {
				Z1K1: pairType1,
				K1: warningKey,
				K2: beWarned
			},
			K2: {
				Z1K1: listType1,
				K1: {
					Z1K1: pairType1,
					K1: reassuranceKey,
					K2: dontBeWarned
				},
				K2: {
					Z1K1: listType1
				}
			}
		}
	};
	const secondResult = setZMapValue( firstResult, reassuranceKey, dontBeWarned );
	assert.deepEqual(
		secondResult, secondExpectedZMap
	);
} );

QUnit.test( 'setMetadataValue', ( assert ) => {
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
	const noEnvelope = { Z1K1: 'Z22', Z22K1: makeVoid(), Z22K2: undefined };
	const emptyEnvelope = { Z1K1: 'Z22', Z22K1: makeVoid(), Z22K2: emptyZMap };
	const singletonEnvelope = { Z1K1: 'Z22', Z22K1: makeVoid(), Z22K2: singletonZMap };
	const modifiedSingletonEnvelope = { Z1K1: 'Z22', Z22K1: makeVoid(), Z22K2: modifiedSingletonZMap };

	assert.deepEqual(
		setMetadataValue(
			noEnvelope,
			{ Z1K1: 'Z6', Z6K1: 'warnings' }, { Z1K1: 'Z6', Z6K1: 'Be warned!' }
		),
		singletonEnvelope
	);
	assert.deepEqual(
		setMetadataValue(
			emptyEnvelope,
			{ Z1K1: 'Z6', Z6K1: 'warnings' }, { Z1K1: 'Z6', Z6K1: 'Be warned!' }
		),
		singletonEnvelope
	);
	assert.deepEqual(
		setMetadataValue(
			singletonEnvelope,
			{ Z1K1: 'Z6', Z6K1: 'warnings' }, { Z1K1: 'Z6', Z6K1: 'Relax, but this is still a warning' }
		),
		modifiedSingletonEnvelope
	);
} );

QUnit.test( 'make* functions', ( assert ) => {
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

	assert.deepEqual(
		makeEmptyZResponseEnvelopeMap(),
		{
			Z1K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z883' }, Z883K1: { Z1K1: 'Z9', Z9K1: 'Z6' }, Z883K2: { Z1K1: 'Z9', Z9K1: 'Z1' } },
			K1: { Z1K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z881' }, Z881K1: { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' }, Z7K1: { Z1K1: 'Z9', Z9K1: 'Z882' }, Z882K1: { Z1K1: 'Z9', Z9K1: 'Z6' }, Z882K2: { Z1K1: 'Z9', Z9K1: 'Z1' } } } }
		}
	);
} );

QUnit.test( 'isVoid', ( assert ) => {
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
	assert.strictEqual( isVoid( { Z1K1: 'Z21' } ), true );
	assert.strictEqual( isVoid( { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z21' } } ), true );
} );

QUnit.test( 'getError', ( assert ) => {
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
	const mappedResultEnvelope2Entries = { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z22' }, Z22K1: { Z1K1: 'Z9', Z9K1: 'Z24' }, Z22K2: doubletonZMap };
	assert.strictEqual( getError( mappedResultEnvelopeErrorsOnly ), error1 );
	assert.strictEqual( getError( mappedResultEnvelope2Entries ), error1 );
	assert.deepEqual( getError( mappedResultEnvelopeNoEntries ), { Z1K1: 'Z9', Z9K1: 'Z24' } );
	assert.deepEqual( getError( mappedResultEnvelopeWithWarnings ), { Z1K1: 'Z9', Z9K1: 'Z24' } );
} );

QUnit.test( 'inferType', ( assert ) => {
	assert.deepEqual( inferType( '' ), 'Z6' );
	assert.deepEqual( inferType( 'Z' ), 'Z6' );
	assert.deepEqual( inferType( 'Z0' ), 'Z6' );
	assert.deepEqual( inferType( 'Z1K1' ), 'Z6' );
	assert.deepEqual( inferType( 'Z1' ), 'Z9' );
	assert.deepEqual( inferType( [ 'Z1' ] ), 'LIST' );
	assert.deepEqual( inferType( { Z1K1: 'Z1' } ), 'Z1' );
} );

QUnit.test( 'kidFromGlobalKey', ( assert ) => {
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

QUnit.test( 'inferItemType', ( assert ) => {
	const singletonZ1Array = [ { Z1K1: 'Z1' } ];
	assert.deepEqual(
		inferItemType( singletonZ1Array, /* canonical= */true ),
		'Z1',
		'Basic Z1 list is identified as such'
	);
	assert.deepEqual(
		inferItemType( singletonZ1Array, /* canonical= */false ),
		{ Z1K1: 'Z9', Z9K1: 'Z1' },
		'Basic Z1 list is identified as such in normal form too'
	);
	assert.deepEqual(
		inferItemType( singletonZ1Array ),
		{ Z1K1: 'Z9', Z9K1: 'Z1' },
		'Basic Z1 list is identified as such in normal form even when not specified'
	);

	assert.deepEqual(
		inferItemType( [ { Z1K1: 'Z6', Z6K1: 'Test' } ], /* canonical= */true ),
		'Z6',
		'Basic Z6 list is identified as such'
	);

	assert.deepEqual(
		inferItemType( [ { Z1K1: 'Z6', Z6K1: 'Test' }, { Z1K1: 'Z6', Z6K1: 'Second test' } ], /* canonical= */true ),
		'Z6',
		'Z6 list of length two is identified as such'
	);

	assert.deepEqual(
		inferItemType( [ { Z1K1: 'Z6', Z6K1: 'Test' }, { Z1K1: 'Z6', Z6K1: 'Second test' }, { Z1K1: 'Z40', Z40K1: 'Z42' } ], /* canonical= */true ),
		'Z1',
		'List with mixed types falls back to Z1'
	);

	assert.deepEqual(
		inferItemType( [ { Z1K1: 'Z9', Z9K1: 'Z12345' } ], /* canonical= */true ),
		'Z1',
		'Basic Z9 list falls back as a Z1 as it is a resolver type'
	);

} );

function Z9_( ZID ) {
	return { Z1K1: 'Z9', Z9K1: ZID };
}

const someArgumentReference = {
	Z1K1: Z9_( 'Z18' ),
	Z18K1: Z9_( 'Z30000K1' )
};

const someReference = Z9_( 'Z30001' );
const builtInReference = Z9_( 'Z39' );

const someFunctionCall = {
	Z1K1: Z9_( 'Z7' ),
	Z7K1: Z9_( 'Z30002' )
};

const typeWithFunctionCallIdentity = {
	Z1K1: Z9_( 'Z4' ),
	Z4K1: someFunctionCall,
	Z4K2: convertArrayToKnownTypedList( [], Z9_( 'Z3' ) ),
	Z4K3: Z9_( 'Z30003' )
};

const typeWithBuiltInReferenceIdentity = { ...typeWithFunctionCallIdentity };
typeWithBuiltInReferenceIdentity.Z4K1 = builtInReference;

const typeWithReferenceIdentity = { ...typeWithFunctionCallIdentity };
typeWithReferenceIdentity.Z4K1 = someReference;

const typeWithTypeWithReferenceIdentityIdentity = { ...typeWithBuiltInReferenceIdentity };
typeWithTypeWithReferenceIdentityIdentity.Z4K1 = typeWithReferenceIdentity;

QUnit.test( 'isZArgumentReference', ( assert ) => {
	assert.true( isZArgumentReference( someArgumentReference ) );
	assert.false( isZArgumentReference( someFunctionCall ) );
	assert.false( isZArgumentReference( someReference ) );
	assert.false( isZArgumentReference( typeWithFunctionCallIdentity ) );
} );

QUnit.test( 'isZFunctionCall', ( assert ) => {
	assert.false( isZFunctionCall( someArgumentReference ) );
	assert.true( isZFunctionCall( someFunctionCall ) );
	assert.false( isZFunctionCall( someReference ) );
	assert.false( isZFunctionCall( typeWithFunctionCallIdentity ) );
} );

QUnit.test( 'isZReference', ( assert ) => {
	assert.false( isZReference( someArgumentReference ) );
	assert.false( isZReference( someFunctionCall ) );
	assert.true( isZReference( someReference ) );
	assert.false( isZReference( typeWithFunctionCallIdentity ) );
} );

QUnit.test( 'isZType', ( assert ) => {
	assert.false( isZType( someArgumentReference ) );
	assert.false( isZType( someFunctionCall ) );
	assert.false( isZType( someReference ) );
	assert.true( isZType( typeWithFunctionCallIdentity ) );
} );

QUnit.test( 'isMemberOfDangerTrio', ( assert ) => {
	assert.true( isMemberOfDangerTrio( someArgumentReference ) );
	assert.true( isMemberOfDangerTrio( someReference ) );
	assert.true( isMemberOfDangerTrio( someFunctionCall ) );
	assert.false( isMemberOfDangerTrio( typeWithFunctionCallIdentity ) );
	assert.false( isMemberOfDangerTrio( typeWithReferenceIdentity ) );
} );

QUnit.test( 'findIdentity', ( assert ) => {
	assert.strictEqual( findIdentity( someFunctionCall ), someFunctionCall );
	assert.strictEqual( findIdentity( someReference ), someReference );
	assert.strictEqual( findIdentity( builtInReference ), builtInReference );
	assert.strictEqual( findIdentity( typeWithFunctionCallIdentity ), someFunctionCall );
	assert.strictEqual( findIdentity( typeWithBuiltInReferenceIdentity ), builtInReference );
	assert.strictEqual( findIdentity( typeWithReferenceIdentity ), typeWithReferenceIdentity );
	assert.strictEqual(
		findIdentity( typeWithTypeWithReferenceIdentityIdentity ), typeWithReferenceIdentity );
} );
