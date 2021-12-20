'use strict';

const { SchemaFactory, ZObjectKeyFactory } = require( '../../../src/schema.js' );

QUnit.module( 'schema.js' );

const factory = new SchemaFactory();

QUnit.test( 'successful parse', ( assert ) => {
	// Trivial valid JSON Schema.
	const schema = factory.parse( {
		type: 'object'
	} );

	assert.notEqual( null, schema );
} );

QUnit.test( 'unsuccessul parse', ( assert ) => {
	const schema = factory.parse( {
		type: 'not supported'
	} );
	assert.deepEqual( null, schema );
} );

QUnit.test( 'validation matches ajv\'s decision', ( assert ) => {
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
	assert.true( schema.validate( strongObject ) );
	assert.true( schema.validate_( strongObject ) );

	// Unsuccessful validation.
	const errayObject = { prop1: [ 'erray' ] };
	assert.false( schema.validate( errayObject ) );
	assert.false( schema.validate_( errayObject ) );
} );

QUnit.test( 'ValidationStatus.parserErrors is populated', ( assert ) => {
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
	assert.deepEqual( [], statusValid.getParserErrors() );
} );

QUnit.test( 'ZObjectKeyFactory with Z7K1 & Z4s as references', ( assert ) => {
	const Z7 = {
		Z1K1: 'Z7',
		Z7K1: 'Z4200',
		Z4200K1: 'Z14',
		Z4200K2: 'Z17'
	};
	assert.deepEqual( 'Z4200(Z14,Z17)', ZObjectKeyFactory.create( Z7 ).asString() );
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
	assert.deepEqual( 'Z4200(Z14,Z17)', ZObjectKeyFactory.create( Z4 ).asString() );
} );

QUnit.test( 'ZObjectKeyFactory with user-defined type', ( assert ) => {
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
	assert.deepEqual( '<Z6,Z931(Z6,Z12)>', ZObjectKeyFactory.create( Z4 ).asString() );
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
	assert.deepEqual( 'Z4200(Z6{"Z6K1":"Smörgåsbord"},Z17)', ZObjectKeyFactory.create( Z1 ).asString() );
} );

QUnit.test( 'ZObjectKey\'s type() is ZObjectKey', ( assert ) => {
	const key = ZObjectKeyFactory.create( {
		Z1K1: 'Z6',
		Z6K1: 'Smörgåsbord'
	} );
	assert.deepEqual( 'ZObjectKey', key.type() );
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
	const key = ZObjectKeyFactory.create( Z1 );
	assert.deepEqual( 'GenericTypeKey', key.type() );
} );

QUnit.test( 'UserDefinedTypeKey\'s type() is UserDefinedTypeKey', ( assert ) => {
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
	const key = ZObjectKeyFactory.create( Z4 );
	assert.deepEqual( 'UserDefinedTypeKey', key.type() );
} );

QUnit.test( 'SimpleTypeKey\'s type() is SimpleTypeKey', ( assert ) => {
	const key = ZObjectKeyFactory.create( {
		Z1K1: 'Z9',
		Z9K1: 'Z9'
	} );
	assert.deepEqual( 'SimpleTypeKey', key.type() );
} );
