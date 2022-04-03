'use strict';

const {
	SchemaFactory,
	validatesAsZObject,
	validatesAsType,
	validatesAsError,
	validatesAsString,
	validatesAsFunctionCall,
	validatesAsArgumentReference,
	ZObjectKeyFactory } = require( '../../../src/schema.js' );
const normalize = require( '../../../src/normalize.js' );
const { isVoid } = require( '../../../src/utils' );

QUnit.module( 'schema.js' );

const factory = new SchemaFactory();

QUnit.test( 'successful parse', ( assert ) => {
	// Trivial valid JSON Schema.
	const schema = factory.parse( {
		type: 'object'
	} );

	assert.notStrictEqual( schema, null );
} );

QUnit.test( 'unsuccessful parse', ( assert ) => {
	const schema = factory.parse( {
		type: 'not supported'
	} );
	assert.deepEqual( schema, null );
} );

QUnit.test( 'validation matches ajv\'s decision', async ( assert ) => {
	const schema = factory.parse( {
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
	assert.true( await schema.validate( strongObject ) );
	assert.true( schema.validate_( strongObject ) );

	// Unsuccessful validation.
	const errayObject = { prop1: [ 'erray' ] };
	assert.false( await schema.validate( errayObject ) );
	assert.false( schema.validate_( errayObject ) );
} );

QUnit.test( 'ValidationStatus.parserErrors is populated', async ( assert ) => {
	const schema = factory.parse( {
		type: 'object',
		required: [ 'prop1' ],
		properties: {
			prop1: {
				type: 'string'
			}
		}
	} );

	// Unsuccessful validation populates errors.
	const statusInvalid = await schema.validateStatus( { prop1: [ 'erray' ] } );

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
	const statusValid = await schema.validateStatus( { prop1: 'string' } );

	assert.true( statusValid.isValid() );
	assert.deepEqual( [], statusValid.getParserErrors() );

	// Also test the toString() method; sorry if this test is fragile, future devs!
	assert.strictEqual( statusInvalid.toString(), '{"isValid":false,"zError":{"Z1K1":{"Z1K1":"Z9","Z9K1":"Z5"},"Z5K1":{"Z1K1":"Z9","Z9K1":"Z502"},"Z5K2":{"Z1K1":{"Z1K1":{"Z1K1":"Z9","Z9K1":"Z7"},"Z7K1":{"Z1K1":"Z9","Z9K1":"Z885"},"Z885K1":{"Z1K1":"Z9","Z9K1":"Z502"}},"Z502K1":{"Z1K1":"Z9","Z9K1":"Z509"},"Z502K2":{"Z1K1":{"Z1K1":"Z9","Z9K1":"Z5"},"Z5K1":{"Z1K1":"Z9","Z9K1":"Z509"},"Z5K2":{"Z1K1":{"Z1K1":{"Z1K1":"Z9","Z9K1":"Z7"},"Z7K1":{"Z1K1":"Z9","Z9K1":"Z885"},"Z885K1":{"Z1K1":"Z9","Z9K1":"Z509"}},"Z509K1":{"Z1K1":{"Z1K1":{"Z1K1":"Z9","Z9K1":"Z7"},"Z7K1":{"Z1K1":"Z9","Z9K1":"Z881"},"Z881K1":{"Z1K1":"Z9","Z9K1":"Z5"}}}}}}}}' );
	assert.strictEqual( statusValid.toString(), '{"isValid":true,"zError":null}' );
} );

QUnit.test( 'subValidator for built-in schema', async ( assert ) => {
	const Z8Schema = SchemaFactory.NORMAL().create( 'Z8' );
	const Z8K2Schema = Z8Schema.subValidator( 'Z8K2' );
	assert.true( await Z8K2Schema.validate( { Z1K1: 'Z9', Z9K1: 'Z40' } ) );
} );

QUnit.test( 'Create GenericSchema from user-defined Z4', async ( assert ) => {
	const canonicalZ4 = {
		Z1K1: 'Z4',
		Z4K1: 'Z10000',
		Z4K2: [
			{
				Z1K1: 'Z3',
				Z3K1: 'Z6',
				Z3K2: {
					Z1K1: 'Z6',
					Z6K1: '10000K1'
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
					Z6K1: '10000K2'
				},
				Z3K3: {
					Z1K1: 'Z9',
					Z9K1: 'Z1212'
				}
			}
		],
		Z4K3: 'Z1000'
	};
	const Z4 = ( await normalize( canonicalZ4 ) ).Z22K1;
	const schemaMap = await SchemaFactory.NORMAL().createUserDefined( [ Z4 ] );
	// TODO (T298049): Why is the first entry here a ZObjectKey instead of a UserDefinedTypeKey?
	assert.deepEqual( [
		'Z4{"Z4K1":"Z10000","Z4K2":"Z881(Z3){\\"K1\\":\\"Z3{\\\\\\"Z3K1\\\\\\":\\\\\\"Z6\\\\\\",\\\\\\"Z3K2\\\\\\":\\\\\\"Z6{\\\\\\\\\\\\\\"Z6K1\\\\\\\\\\\\\\":\\\\\\\\\\\\\\"10000K1\\\\\\\\\\\\\\"}\\\\\\",\\\\\\"Z3K3\\\\\\":\\\\\\"Z1212\\\\\\"}\\",\\"K2\\":\\"Z881(Z3){\\\\\\"K1\\\\\\":\\\\\\"Z3{\\\\\\\\\\\\\\"Z3K1\\\\\\\\\\\\\\":\\\\\\\\\\\\\\"Z931(Z6)\\\\\\\\\\\\\\",\\\\\\\\\\\\\\"Z3K2\\\\\\\\\\\\\\":\\\\\\\\\\\\\\"Z6{\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"Z6K1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"10000K2\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"}\\\\\\\\\\\\\\",\\\\\\\\\\\\\\"Z3K3\\\\\\\\\\\\\\":\\\\\\\\\\\\\\"Z1212\\\\\\\\\\\\\\"}\\\\\\",\\\\\\"K2\\\\\\":\\\\\\"Z881(Z3){}\\\\\\"}\\"}","Z4K3":"Z1000"}',
		'Z931(Z6)'
	], [ ...schemaMap.keys() ] );
} );

QUnit.test( 'subValidator for generic schema', async ( assert ) => {
	const canonicalZ4 = {
		Z1K1: 'Z4',
		Z4K1: 'Z10000',
		Z4K2: [
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
	const Z4 = ( await normalize( canonicalZ4 ) ).Z22K1;
	const schemaMap = await SchemaFactory.NORMAL().createUserDefined( [ Z4 ] );
	const objectKey = await ZObjectKeyFactory.create( Z4 );
	const topLevel = schemaMap.get( objectKey.asString() );
	const Z6Schema = topLevel.subValidator( 'Z10000K1' );
	assert.true( await Z6Schema.validate( { Z1K1: 'Z6', Z6K1: 'Z 4 0' } ) );
} );

QUnit.test( 'ZObjectKeyFactory with Z7K1 & Z4s as references', async ( assert ) => {
	const Z7 = {
		Z1K1: 'Z7',
		Z7K1: 'Z4200',
		Z4200K1: 'Z14',
		Z4200K2: 'Z17'
	};
	assert.deepEqual( ( await ZObjectKeyFactory.create( Z7 ) ).asString(), 'Z4200(Z14,Z17)' );
} );

QUnit.test( 'ZObjectKeyFactory with Z7K1 & Z4s as reified types', async ( assert ) => {
	const Z4 = {
		Z1K1: 'Z4',
		Z4K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z4200',
			Z4200K1: {
				Z1K1: 'Z4',
				Z4K1: 'Z14',
				Z4K2: [],
				Z4K3: 'Z1000'
			},
			Z4200K2: {
				Z1K1: 'Z4',
				Z4K1: 'Z17',
				Z4K2: [],
				Z4K3: 'Z1000'
			}
		},
		Z4K2: [],
		Z4K3: {
			Z1K1: 'Z9',
			Z9K1: 'Z1001'
		}
	};
	assert.deepEqual( ( await ZObjectKeyFactory.create( Z4 ) ).asString(), 'Z4200(Z14,Z17)' );
} );

QUnit.test( 'ZObjectKeyFactory with user-defined type', async ( assert ) => {
	const Z4 = {
		Z1K1: 'Z4',
		Z4K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z1000'
		},
		Z4K2: [
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
	assert.deepEqual( ( await ZObjectKeyFactory.create( Z4 ) ).asString(), '<Z6,Z931(Z6,Z12)>' );
} );

QUnit.test( 'ZObjectKeyFactory with generic type parameterized by object', async ( assert ) => {
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
				Z4K2: [],
				Z4K3: 'Z1000'
			}
		},
		Z4K2: [],
		Z4K3: {
			Z1K1: 'Z9',
			Z9K1: 'Z1001'
		}
	};
	assert.deepEqual( ( await ZObjectKeyFactory.create( Z1 ) ).asString(), 'Z4200(Z6{"Z6K1":"Smörgåsbord"},Z17)' );
} );

QUnit.test( 'ZObjectKey\'s type() is ZObjectKey', async ( assert ) => {
	const key = await ZObjectKeyFactory.create( {
		Z1K1: 'Z6',
		Z6K1: 'Smörgåsbord'
	} );
	assert.deepEqual( key.type(), 'ZObjectKey' );
} );

QUnit.test( 'GenericTypeKey\'s type() is GenericTypeKey', async ( assert ) => {
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
				Z4K2: [],
				Z4K3: 'Z1000'
			}
		},
		Z4K2: [],
		Z4K3: {
			Z1K1: 'Z9',
			Z9K1: 'Z1001'
		}
	};
	const key = await ZObjectKeyFactory.create( Z1 );
	assert.deepEqual( key.type(), 'GenericTypeKey' );
} );

QUnit.test( 'UserDefinedTypeKey\'s type() is UserDefinedTypeKey', async ( assert ) => {
	const Z4 = {
		Z1K1: 'Z4',
		Z4K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z1000'
		},
		Z4K2: [
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
	const key = await ZObjectKeyFactory.create( Z4 );
	assert.deepEqual( key.type(), 'UserDefinedTypeKey' );
} );

QUnit.test( 'SimpleTypeKey\'s type() is SimpleTypeKey', async ( assert ) => {
	const key = await ZObjectKeyFactory.create( {
		Z1K1: 'Z9',
		Z9K1: 'Z9'
	} );
	assert.deepEqual( key.type(), 'SimpleTypeKey' );
} );

QUnit.test( 'validatesAsZObject', async ( assert ) => {
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
	assert.true( ( await validatesAsZObject( input ) ).isValid() );
} );

QUnit.test( 'validatesAsType', async ( assert ) => {
	const Z4 = {
		Z1K1: 'Z4',
		Z4K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z4200',
			Z4200K1: {
				Z1K1: 'Z4',
				Z4K1: 'Z14',
				Z4K2: [],
				Z4K3: 'Z1000'
			},
			Z4200K2: {
				Z1K1: 'Z4',
				Z4K1: 'Z17',
				Z4K2: [],
				Z4K3: 'Z1000'
			}
		},
		Z4K2: [],
		Z4K3: {
			Z1K1: 'Z9',
			Z9K1: 'Z1001'
		}
	};
	const normalizedZ4 = ( await normalize( Z4 ) ).Z22K1;
	assert.true( ( await validatesAsType( normalizedZ4 ) ).isValid() );
} );

QUnit.test( 'validatesAsError', async ( assert ) => {
	const Z5 = { Z1K1: 'Z5', Z5K1: 'Z500', Z5K2: { Z1K1: { Z1K1: 'Z7', Z7K1: 'Z885', Z885K1: 'Z500' }, Z500K1: 'Basic data' } };
	const normalizedZ5 = ( await normalize( Z5 ) ).Z22K1;
	assert.true( ( await validatesAsError( normalizedZ5 ) ).isValid() );
} );

QUnit.test( 'validatesAsString', async ( assert ) => {
	const input = {
		Z1K1: 'Z6',
		Z6K1: 'air on the G Z6'
	};
	assert.true( ( await validatesAsString( input ) ).isValid() );
} );

QUnit.test( 'validatesAsFunctionCall', async ( assert ) => {
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
	assert.true( ( await validatesAsFunctionCall( input ) ).isValid() );
} );

QUnit.test( 'validatesAsArgumentReference', async ( assert ) => {
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
	assert.true( ( await validatesAsArgumentReference( input ) ).isValid() );
} );

QUnit.test( 'isVoid', async ( assert ) => {
	const input = {
		Z1K1: 'Z9',
		Z9K1: 'Z24'
	};
	assert.true( ( isVoid( input ) ) );
} );
