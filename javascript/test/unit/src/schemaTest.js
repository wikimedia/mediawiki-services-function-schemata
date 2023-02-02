'use strict';

const {
	SchemaFactory,
	validatesAsZObject,
	validatesAsType,
	validatesAsError,
	validatesAsString,
	validatesAsFunctionCall,
	validatesAsArgumentReference,
	validatesAsBoolean,
	ZObjectKeyFactory } = require( '../../../src/schema.js' );
const normalize = require( '../../../src/normalize.js' );
const {
	isVoid,
	isZMap } = require( '../../../src/utils' );

QUnit.module( 'schema.js' );

const EMPTY_FACTORY = new SchemaFactory();
const NORMAL_FACTORY = SchemaFactory.NORMAL();
const CANONICAL_FACTORY = SchemaFactory.CANONICAL();

QUnit.test( 'successful parse', ( assert ) => {
	// Trivial valid JSON Schema.
	const schema = EMPTY_FACTORY.parse( {
		type: 'object'
	} );

	assert.notStrictEqual( schema, null );
} );

QUnit.test( 'unsuccessful parse', ( assert ) => {
	const schema = EMPTY_FACTORY.parse( {
		type: 'not supported'
	} );
	assert.deepEqual( schema, null );
} );

QUnit.test( 'nonexist schema name', ( assert ) => {
	const schema = EMPTY_FACTORY.create( 'Z10' );
	assert.strictEqual( schema, null );
} );

QUnit.test( 'validation matches ajv\'s decision', ( assert ) => {
	const schema = EMPTY_FACTORY.parse( {
		type: 'object',
		required: [ 'prop1' ],
		properties: {
			prop1: {
				type: 'string'
			}
		}
	} );

	// Successful validation; "validate_" is the underlying ajv validator.
	const strongObject = { prop1: 'strong' };
	assert.true( schema.validate( strongObject ) );
	assert.true( schema.validate_( strongObject ) );

	// Unsuccessful validation.
	const errayObject = { prop1: [ 'erray' ] };
	assert.false( schema.validate( errayObject ) );
	assert.false( schema.validate_( errayObject ) );
} );

QUnit.test( 'ValidationStatus.parserErrors is populated', ( assert ) => {
	const schema = EMPTY_FACTORY.parse( {
		type: 'object',
		required: [ 'prop1' ],
		properties: {
			prop1: {
				type: 'string'
			}
		}
	} );

	// Unsuccessful validation populates errors.
	const statusInvalid = schema.validateStatus( { prop1: [ 'erray' ] } );

	assert.false( statusInvalid.isValid() );
	assert.deepEqual(
		statusInvalid.getParserErrors(),
		[
			{
				instancePath: '/prop1',
				schemaPath: '#/properties/prop1/type',
				keyword: 'type',
				params: {
					type: 'string'
				},
				message: 'must be string',
				schema: 'string',
				parentSchema: {
					type: 'string'
				},
				data: [
					'erray'
				]
			}
		]
	);

	// Unsuccessful validation populates errors.
	const statusValid = schema.validateStatus( { prop1: 'string' } );

	assert.true( statusValid.isValid() );
	assert.deepEqual( statusValid.getParserErrors(), [] );

	// Also test the toString() method; sorry if this test is fragile, future devs!
	assert.strictEqual( statusInvalid.toString(), '{"isValid":false,"zError":{"Z1K1":{"Z1K1":"Z9","Z9K1":"Z5"},"Z5K1":{"Z1K1":"Z9","Z9K1":"Z502"},"Z5K2":{"Z1K1":{"Z1K1":{"Z1K1":"Z9","Z9K1":"Z7"},"Z7K1":{"Z1K1":"Z9","Z9K1":"Z885"},"Z885K1":{"Z1K1":"Z9","Z9K1":"Z502"}},"Z502K1":{"Z1K1":"Z9","Z9K1":"Z509"},"Z502K2":{"Z1K1":{"Z1K1":"Z9","Z9K1":"Z5"},"Z5K1":{"Z1K1":"Z9","Z9K1":"Z509"},"Z5K2":{"Z1K1":{"Z1K1":{"Z1K1":"Z9","Z9K1":"Z7"},"Z7K1":{"Z1K1":"Z9","Z9K1":"Z885"},"Z885K1":{"Z1K1":"Z9","Z9K1":"Z509"}},"Z509K1":{"Z1K1":{"Z1K1":{"Z1K1":"Z9","Z9K1":"Z7"},"Z7K1":{"Z1K1":"Z9","Z9K1":"Z881"},"Z881K1":{"Z1K1":"Z9","Z9K1":"Z5"}}}}}}}}' );
	assert.strictEqual( statusValid.toString(), '{"isValid":true,"zError":null}' );
} );

QUnit.test( 'subValidator for built-in schema', ( assert ) => {
	const Z8Schema = NORMAL_FACTORY.create( 'Z8' );
	const Z8K2Schema = Z8Schema.subValidator( 'Z8K2' );
	assert.true( Z8K2Schema.validate( { Z1K1: 'Z9', Z9K1: 'Z40' } ) );
	assert.deepEqual(
		Z8Schema.subValidatorKeys(),
		[ 'Z1K1', 'Z8K1', 'Z8K2', 'Z8K3', 'Z8K4', 'Z8K5' ] );
} );

QUnit.test( 'no dummy subvalidator for built-in schema', ( assert ) => {
	const DummySchema = NORMAL_FACTORY.getSubSchemas_( 'Dummy' );
	assert.true( DummySchema instanceof Map && DummySchema.size === 0 );
} );

QUnit.test( 'subvalidators for ZID_literal schema', ( assert ) => {
	const Z8LiteralSchema = NORMAL_FACTORY.create( 'Z8_literal' );
	assert.deepEqual(
		Z8LiteralSchema.subValidatorKeys(),
		[ 'Z1K1', 'Z8K1', 'Z8K2', 'Z8K3', 'Z8K4', 'Z8K5' ] );
	const Z1K1Schema = Z8LiteralSchema.subValidator( 'Z1K1' );
	const Z8K1Schema = Z8LiteralSchema.subValidator( 'Z8K1' );
	const Z8K2Schema = Z8LiteralSchema.subValidator( 'Z8K2' );
	const Z8K3Schema = Z8LiteralSchema.subValidator( 'Z8K3' );
	const Z8K4Schema = Z8LiteralSchema.subValidator( 'Z8K4' );
	const Z8K5Schema = Z8LiteralSchema.subValidator( 'Z8K5' );
	assert.true( Z1K1Schema.validate( { Z1K1: 'Z9', Z9K1: 'Z8' } ) );
	assert.false( Z8K1Schema.validate( {} ) );
	assert.false( Z8K2Schema.validate( {} ) );
	assert.false( Z8K3Schema.validate( {} ) );
	assert.false( Z8K4Schema.validate( {} ) );
	assert.false( Z8K5Schema.validate( {} ) );
} );

QUnit.test( 'no subvalidator for CANONICAL Z9 schema', ( assert ) => {
	const Z9Schema = CANONICAL_FACTORY.create( 'Z9' );
	assert.deepEqual( Z9Schema.subValidatorKeys(), [] );
} );

QUnit.test( 'subvalidators for GENERIC', ( assert ) => {
	const genericSchema = NORMAL_FACTORY.create( 'GENERIC' );
	assert.true(
		genericSchema.subValidator( 'Z1K1' ).validate( {
			Z1K1: 'Z9',
			Z9K1: 'Z10001'
		} ) );
} );

QUnit.test( 'subvalidators for GENERIC_literal', ( assert ) => {
	const genericSchema = NORMAL_FACTORY.create( 'GENERIC' );
	assert.true(
		genericSchema.subValidator( 'Z1K1' ).validate( {
			Z1K1: 'Z9',
			Z9K1: 'Z10001'
		} ) );
} );

QUnit.test( 'validator for Z41/Z42 falls back to Z40 schema', ( assert ) => {
	const Z41Schema = CANONICAL_FACTORY.create( 'Z41' );
	assert.true( Z41Schema.validate( { Z1K1: 'Z40', Z40K1: 'Z41' } ) );
	assert.true( Z41Schema.validate( { Z1K1: 'Z40', Z40K1: 'Z42' } ) );
	assert.deepEqual( Z41Schema.subValidatorKeys(), [ 'Z1K1', 'Z40K1' ] );

	const Z42Schema = CANONICAL_FACTORY.create( 'Z42' );
	assert.true( Z42Schema.validate( { Z1K1: 'Z40', Z40K1: 'Z41' } ) );
	assert.true( Z42Schema.validate( { Z1K1: 'Z40', Z40K1: 'Z42' } ) );
	assert.deepEqual( Z42Schema.subValidatorKeys(), [ 'Z1K1', 'Z40K1' ] );
} );

const canonicalZ4 = {
	Z1K1: 'Z4',
	Z4K1: 'Z10000',
	Z4K2: [
		'Z3',
		{
			Z1K1: 'Z3',
			Z3K1: 'Z6',
			Z3K2: {
				Z1K1: 'Z6',
				Z6K1: 'Z10000K1'
			},
			Z3K3: {
				Z1K1: 'Z9',
				Z9K1: 'Z1212'
			}
		},
		{
			Z1K1: 'Z3',
			Z3K1: {
				Z1K1: 'Z4',
				Z4K1: {
					Z1K1: 'Z7',
					Z7K1: 'Z931',
					Z931K1: 'Z6'
				},
				Z4K2: [
					'Z3',
					{
						Z1K1: 'Z3',
						Z3K1: 'Z6',
						Z3K2: {
							Z1K1: 'Z6',
							Z6K1: 'K1'
						},
						Z3K3: {
							Z1K1: 'Z9',
							Z9K1: 'Z1212'
						}
					}
				],
				Z4K3: 'Z1000'
			},
			Z3K2: {
				Z1K1: 'Z6',
				Z6K1: 'Z10000K2'
			},
			Z3K3: {
				Z1K1: 'Z9',
				Z9K1: 'Z1212'
			}
		}
	],
	Z4K3: 'Z1000'
};

QUnit.test( 'Create GenericSchema from user-defined Z4', ( assert ) => {
	// See T304144 re: the withVoid arg of normalize, and the impact of setting it to true
	const Z4 = normalize( canonicalZ4,
		/* generically= */ true, /* withVoid= */ true, /* fromBenjamin= */ true ).Z22K1;
	const schemaMap = NORMAL_FACTORY.createUserDefined(
		[ Z4 ], /* benjamin= */ true
	);
	assert.deepEqual(
		[ ...schemaMap.keys() ],
		[
			'<Z10000K1:Z6,Z10000K2:Z931(Z6)>',
			'Z931(Z6)'
		] );
} );

QUnit.test( 'subValidator for user-defined generic schema', ( assert ) => {
	// See T304144 re: the withVoid arg of normalize, and the impact of setting it to true
	const Z4 = normalize( canonicalZ4,
		/* generically= */ true, /* withVoid= */ true, /* fromBenjamin= */ true ).Z22K1;
	const schemaMap = NORMAL_FACTORY.createUserDefined(
		[ Z4 ], /* benjamin= */ true
	);
	const objectKey = ZObjectKeyFactory.create( Z4, /* benjamin= */ true );
	const topLevel = schemaMap.get( objectKey.asString() );
	const Z6Schema = topLevel.subValidator( 'Z10000K1' );
	assert.true( Z6Schema.validate( { Z1K1: 'Z6', Z6K1: 'Z 4 0' } ) );
} );

QUnit.test( 'GenericSchema disallows extra keys', ( assert ) => {
	const anotherCanonicalZ4 = {
		Z1K1: 'Z4',
		Z4K1: 'Z10000',
		Z4K2: [
			'Z3',
			{
				Z1K1: 'Z3',
				Z3K1: 'Z6',
				Z3K2: {
					Z1K1: 'Z6',
					Z6K1: 'Z10000K1'
				},
				Z3K3: {
					Z1K1: 'Z9',
					Z9K1: 'Z1212'
				}
			}
		],
		Z4K3: 'Z1000'
	};
	// See T304144 re: the withVoid arg of normalize, and the impact of setting it to true
	const Z4 = normalize( anotherCanonicalZ4,
		/* generically= */ true, /* withVoid= */ true, /* fromBenjamin= */ true ).Z22K1;
	const schemaMap = NORMAL_FACTORY.createUserDefined(
		[ Z4 ], /* benjamin= */ true
	);
	const objectKey = ZObjectKeyFactory.create( Z4, /* benjamin= */ true );
	const topLevel = schemaMap.get( objectKey.asString() );
	assert.true( topLevel.validate( { Z1K1: Z4, Z10000K1: { Z1K1: 'Z6', Z6K1: 'a string' } } ) );
	assert.false( topLevel.validate( { Z1K1: Z4, Z10000K1: { Z1K1: 'Z6', Z6K1: 'a string' }, Z10000K2: { Z1K1: 'Z6', Z6K1: 'not a string' } } ) );
} );

QUnit.test( 'GenericSchema allows the danger trio', ( assert ) => {
	const anotherCanonicalZ4 = {
		Z1K1: 'Z4',
		Z4K1: 'Z10000',
		Z4K2: [
			'Z3',
			{
				Z1K1: 'Z3',
				Z3K1: 'Z6',
				Z3K2: {
					Z1K1: 'Z6',
					Z6K1: 'Z10000K1'
				},
				Z3K3: {
					Z1K1: 'Z9',
					Z9K1: 'Z1212'
				}
			},
			{
				Z1K1: 'Z3',
				Z3K1: 'Z6',
				Z3K2: {
					Z1K1: 'Z6',
					Z6K1: 'Z10000K2'
				},
				Z3K3: {
					Z1K1: 'Z9',
					Z9K1: 'Z1212'
				}
			},
			{
				Z1K1: 'Z3',
				Z3K1: 'Z6',
				Z3K2: {
					Z1K1: 'Z6',
					Z6K1: 'Z10000K3'
				},
				Z3K3: {
					Z1K1: 'Z9',
					Z9K1: 'Z1212'
				}
			}
		],
		Z4K3: 'Z1000'
	};
	// See T304144 re: the withVoid arg of normalize, and the impact of setting it to true
	const Z4 = normalize( anotherCanonicalZ4,
		/* generically= */ true, /* withVoid= */ true, /* fromBenjamin= */ true ).Z22K1;
	const schemaMap = NORMAL_FACTORY.createUserDefined(
		[ Z4 ], /* benjamin= */ true
	);
	const objectKey = ZObjectKeyFactory.create( Z4, /* benjamin= */ true );
	const topLevel = schemaMap.get( objectKey.asString() );

	const toValidate = normalize(
		{
			Z1K1: Z4,
			Z10000K1: 'Z40000',
			Z10000K2: {
				Z1K1: 'Z18',
				Z18K1: 'Z40000K1'
			},
			Z10000K3: {
				Z1K1: 'Z7',
				Z7K1: 'Z40001'
			}
		},
		/* generically= */ true, /* withVoid= */ true, /* fromBenjamin= */ true
	).Z22K1;

	assert.true( topLevel.validate( toValidate ) );
} );

QUnit.test( 'ZObjectKeyFactory with Z7K1 & Z4s as references', ( assert ) => {
	const Z7 = {
		Z1K1: 'Z7',
		Z7K1: 'Z4200',
		Z4200K1: 'Z14',
		Z4200K2: 'Z17'
	};
	assert.deepEqual( ZObjectKeyFactory.create( Z7, /* benjamin= */ true ).asString(), 'Z4200(Z14,Z17)' );
} );

QUnit.test( 'ZObjectKeyFactory with Z7K1 & Z4s as reified types', ( assert ) => {
	const Z4 = {
		Z1K1: 'Z4',
		Z4K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z4200',
			Z4200K1: {
				Z1K1: 'Z4',
				Z4K1: 'Z14',
				Z4K2: [
					'Z3'
				],
				Z4K3: 'Z1000'
			},
			Z4200K2: {
				Z1K1: 'Z4',
				Z4K1: 'Z17',
				Z4K2: [
					'Z3'
				],
				Z4K3: 'Z1000'
			}
		},
		Z4K2: [
			'Z3'
		],
		Z4K3: {
			Z1K1: 'Z9',
			Z9K1: 'Z1001'
		}
	};
	assert.deepEqual( ZObjectKeyFactory.create( Z4, /* benjamin= */ true ).asString(), 'Z4200(Z14,Z17)' );
} );

QUnit.test( 'ZObjectKeyFactory with user-defined type', ( assert ) => {
	const Z4 = {
		Z1K1: 'Z4',
		Z4K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z1000'
		},
		Z4K2: [
			'Z3',
			{
				Z1K1: 'Z3',
				Z3K1: 'Z6',
				Z3K2: {
					Z1K1: 'Z6',
					Z6K1: 'K1'
				},
				Z3K3: {
					Z1K1: 'Z9',
					Z9K1: 'Z1212'
				}
			},
			{
				Z1K1: 'Z3',
				Z3K1: {
					Z1K1: 'Z7',
					Z7K1: 'Z931',
					Z931K1: 'Z6',
					Z931K2: 'Z12'
				},
				Z3K2: {
					Z1K1: 'Z6',
					Z6K1: 'K2'
				},
				Z3K3: {
					Z1K1: 'Z9',
					Z9K1: 'Z1212'
				}
			}
		],
		Z4K3: {
			Z1K1: 'Z9',
			Z9K1: 'Z1001'
		}
	};
	assert.deepEqual( ZObjectKeyFactory.create( Z4, /* benjamin= */ true ).asString(), '<K1:Z6,K2:Z931(Z6,Z12)>' );
} );

QUnit.test( 'ZObjectKeyFactory with generic type parameterized by object', ( assert ) => {
	const Z1 = {
		Z1K1: 'Z4',
		Z4K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z4200',
			Z4200K1: {
				Z1K1: 'Z6',
				Z6K1: 'Smörgåsbord'
			},
			Z4200K2: {
				Z1K1: 'Z4',
				Z4K1: 'Z17',
				Z4K2: [
					'Z3'
				],
				Z4K3: 'Z1000'
			}
		},
		Z4K2: [
			'Z3'
		],
		Z4K3: {
			Z1K1: 'Z9',
			Z9K1: 'Z1001'
		}
	};
	assert.deepEqual( ZObjectKeyFactory.create( Z1, /* benjamin= */ true ).asString(), 'Z4200(Z6{"Z6K1":"Smörgåsbord"},Z17)' );
} );

QUnit.test( 'ZObjectKeyFactory with invalid object', ( assert ) => {
	const invalidZObject = {
		Hello: 'Molly',
		This: 'is Louis, Molly'
	};
	let failedResponse;
	try {
		failedResponse = ZObjectKeyFactory.create( invalidZObject ).asString();
	} catch ( error ) {
		// These are implementation details and not guaranteed-stable
		assert.strictEqual( error.name, 'Error' );
		assert.strictEqual( error.message, 'Invalid ZObject input for type' );
		assert.true( isZMap( error.errorZObjectPayload ) );
		assert.strictEqual( error.errorZObjectPayload.K1.K1.K1.Z6K1, 'errors' );
		assert.strictEqual( error.errorZObjectPayload.K1.K1.K2.Z5K1.Z9K1, 'Z502' );
	}
	// If we've set a response then something went wrong in going wrong.
	assert.deepEqual( failedResponse, undefined );
} );

QUnit.test( 'ZObjectKey\'s type() is ZObjectKey', ( assert ) => {
	const key = ZObjectKeyFactory.create( {
		Z1K1: 'Z6',
		Z6K1: 'Smörgåsbord'
	}, /* benjamin= */ true );
	assert.deepEqual( key.type(), 'ZObjectKey' );
} );

QUnit.test( 'GenericTypeKey\'s type() is GenericTypeKey', ( assert ) => {
	const Z1 = {
		Z1K1: 'Z4',
		Z4K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z4200',
			Z4200K1: {
				Z1K1: 'Z6',
				Z6K1: 'Smörgåsbord'
			},
			Z4200K2: {
				Z1K1: 'Z4',
				Z4K1: 'Z17',
				Z4K2: [
					'Z3'
				],
				Z4K3: 'Z1000'
			}
		},
		Z4K2: [
			'Z3'
		],
		Z4K3: {
			Z1K1: 'Z9',
			Z9K1: 'Z1001'
		}
	};
	const key = ZObjectKeyFactory.create( Z1, /* benjamin= */ true );
	assert.deepEqual( key.type(), 'GenericTypeKey' );
} );

QUnit.test( 'UserDefinedTypeKey\'s type() is UserDefinedTypeKey', ( assert ) => {
	const Z4 = {
		Z1K1: 'Z4',
		Z4K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z1000'
		},
		Z4K2: [
			'Z3',
			{
				Z1K1: 'Z3',
				Z3K1: 'Z6',
				Z3K2: {
					Z1K1: 'Z6',
					Z6K1: 'K1'
				},
				Z3K3: {
					Z1K1: 'Z9',
					Z9K1: 'Z1212'
				}
			},
			{
				Z1K1: 'Z3',
				Z3K1: {
					Z1K1: 'Z7',
					Z7K1: 'Z931',
					Z931K1: 'Z6',
					Z931K2: 'Z12'
				},
				Z3K2: {
					Z1K1: 'Z6',
					Z6K1: 'K2'
				},
				Z3K3: {
					Z1K1: 'Z9',
					Z9K1: 'Z1212'
				}
			}
		],
		Z4K3: {
			Z1K1: 'Z9',
			Z9K1: 'Z1001'
		}
	};
	const key = ZObjectKeyFactory.create( Z4, /* benjamin= */ true );
	assert.deepEqual( key.type(), 'UserDefinedTypeKey' );
} );

QUnit.test( 'SimpleTypeKey\'s type() is SimpleTypeKey', ( assert ) => {
	const key = ZObjectKeyFactory.create( {
		Z1K1: 'Z9',
		Z9K1: 'Z9'
	}, /* benjamin= */ true );
	assert.deepEqual( key.type(), 'SimpleTypeKey' );
} );

QUnit.test( 'validatesAsZObject', ( assert ) => {
	const input = {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z1000'
		},
		Z1000K1: {
			Z1K1: 'Z6',
			Z6K1: 'air on the G Z6'
		}
	};
	assert.true( validatesAsZObject( input ).isValid() );
} );

QUnit.test( 'validatesAsType', ( assert ) => {
	const Z4 = {
		Z1K1: 'Z4',
		Z4K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z4200',
			Z4200K1: {
				Z1K1: 'Z4',
				Z4K1: 'Z14',
				Z4K2: [
					'Z3'
				],
				Z4K3: 'Z1000'
			},
			Z4200K2: {
				Z1K1: 'Z4',
				Z4K1: 'Z17',
				Z4K2: [
					'Z3'
				],
				Z4K3: 'Z1000'
			}
		},
		Z4K2: [
			'Z3'
		],
		Z4K3: {
			Z1K1: 'Z9',
			Z9K1: 'Z1001'
		}
	};
	// See T304144 re: the withVoid arg of normalize, and the impact of setting it to true
	const normalizedZ4 = normalize( Z4,
		/* generically= */ true, /* withVoid= */ true, /* fromBenjamin= */ true ).Z22K1;
	assert.true( validatesAsType( normalizedZ4 ).isValid() );
} );

QUnit.test( 'validatesAsError', ( assert ) => {
	const Z5 = { Z1K1: 'Z5', Z5K1: 'Z500', Z5K2: { Z1K1: { Z1K1: 'Z7', Z7K1: 'Z885', Z885K1: 'Z500' }, Z500K1: 'Basic data' } };
	// See T304144 re: the withVoid arg of normalize, and the impact of setting it to true
	const normalizedZ5 = normalize( Z5,
	/* generically= */ true, /* withVoid= */ true, /* fromBenjamin= */ true ).Z22K1;
	assert.true( validatesAsError( normalizedZ5 ).isValid() );
} );

QUnit.test( 'validatesAsString', ( assert ) => {
	const input = {
		Z1K1: 'Z6',
		Z6K1: 'air on the G Z6'
	};
	assert.true( validatesAsString( input ).isValid() );
} );

QUnit.test( 'validatesAsFunctionCall', ( assert ) => {
	const input = {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z7'
		},
		Z7K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z801'
		}
	};
	assert.true( validatesAsFunctionCall( input ).isValid() );
} );

QUnit.test( 'validatesAsArgumentReference', ( assert ) => {
	const input = {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z18'
		},
		Z18K1: {
			Z1K1: 'Z6',
			Z6K1: 'Z801K1'
		}
	};
	assert.true( validatesAsArgumentReference( input ).isValid() );
} );

QUnit.test( 'validatesAsBoolean, valid input', ( assert ) => {
	const input = {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z40'
		},
		Z40K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z41'
		}
	};
	assert.true( validatesAsBoolean( input ).isValid() );
} );

QUnit.test( 'validatesAsBoolean, invalid input', ( assert ) => {
	const input = {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z40'
		},
		Z40K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z411'
		}
	};
	assert.false( validatesAsBoolean( input ).isValid() );
} );

QUnit.test( 'isVoid', ( assert ) => {
	const input = {
		Z1K1: 'Z9',
		Z9K1: 'Z24'
	};
	assert.true( ( isVoid( input ) ) );
	// Check this doesn't throw.
	assert.false( ( isVoid( null ) ) );
} );

QUnit.test( 'concurrency no cross-contaminatation', async ( assert ) => {
	// This test serves purely illustrative purposes that the validators will
	// not cross-contaminate validtion results. It does not infer anything
	// about the implementation details.
	const input1 = {
		Z1K1: 'Z5',
		Z5K1: 'Z500',
		Z5K2: {
			Z1K1: {
				Z1K1: 'Z7',
				Z7K1: 'Z885',
				Z885K1: 'Z500'
			},
			Z500K1: 'Basic data'
		}
	};
	const input2 = {
		Z1K1: 'nothing'
	};
	await Promise.all(
		[
			// eslint-disable-next-line no-unused-vars
			new Promise( function ( resolve, reject ) {
				resolve( validatesAsError( input1 ) );
			} ),
			// eslint-disable-next-line no-unused-vars
			new Promise( function ( resolve, reject ) {
				resolve( validatesAsError( input2 ) );
			} )
		] ).then(
		( results ) => {
			// If there is any concurrency issue, these two runs would get the same error (flakily).
			assert.notStrictEqual( results[ 0 ].getParserErrors(), results[ 1 ].getParserErrors() );
		}
	);
} );
