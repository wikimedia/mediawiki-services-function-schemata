'use strict';

const { ZObject, ZObjectBuilder } = require( '../../../classes/zObject.js' );

QUnit.module( 'zObject.js' );

// Helper functions and classes.

function alwaysValid() {
	return {
		isValid() {
			// Will always pass validation
			return true;
		}
	};
}

function alwaysInvalid() {
	return {
		isValid() {
			// Will always fail validation.
			return false;
		},
		getZ5() {
			return { reason: 'Fake error message' };
		}
	};
}

// Dummy child class for ZObject.
class TestZObject extends ZObject {}

// Dummy child class for ZObjectBuilder.
class TestBuilder extends ZObjectBuilder {
	constructor() {
		super( TestZObject );
	}

	validateZObject() {
		return alwaysValid();
	}
}

QUnit.test( 'ZObjectBuilder no instantiation', ( assert ) => {
	assert.throws(
		() => { return new ZObjectBuilder(); },
		( err ) => err.toString().includes( 'cannot be instantiated' )
	);
} );

QUnit.test( 'ZObject no instantiation', ( assert ) => {
	assert.throws(
		() => { return new ZObject( {} ); },
		( err ) => err.toString().includes( 'cannot be instantiated' )
	);
} );

QUnit.test( 'ZObject child class', ( assert ) => {
	const jsonObj = { val: 'Foo' };
	// This is not how you are supposed to create a ZObject EVER, but
	// for unit test purposes it is fine.
	const newInstance = new TestZObject( jsonObj );
	assert.deepEqual( newInstance.normalJSON, jsonObj );
} );

QUnit.test( 'ZObjectBuilder child class without child ZObject', ( assert ) => {
	class BadBuilder extends ZObjectBuilder {
		constructor() {
			// this is using the parent/abstract ZObject
			super( ZObject );
		}

		validateZObject() {
			return alwaysValid();
		}
	}
	assert.throws(
		() => new BadBuilder().build(),
		( err ) => err.toString().includes( 'cannot be instantiated' ) );
} );

QUnit.test( 'ZObjectBuilder child class without validation function', ( assert ) => {
	class BadBuilder extends ZObjectBuilder {
		constructor() {
			super( TestZObject );
		}
	}
	assert.throws(
		() => new BadBuilder().build(),
		( err ) => err.toString().includes( 'not yet been defined' ) );
} );

QUnit.test( 'ZObjectBuilder child class success', ( assert ) => {
	const correctJson = { val: 'Bar' };
	const builder = new TestBuilder().setNormalJSON( correctJson );
	assert.strictEqual( builder.normalJSON, correctJson );
	const testObj = builder.build();
	assert.deepEqual( testObj.normalJSON, correctJson );
} );

QUnit.test( 'ZObject child fails validation', ( assert ) => {
	class BadBuilder extends ZObjectBuilder {
		constructor() {
			super( TestZObject );
		}

		validateZObject() {
			return alwaysInvalid();
		}
	}
	const jsonObj = { val: 'Bar' };
	const builder = new BadBuilder().setNormalJSON( jsonObj );
	assert.throws(
		() => builder.build(),
		( err ) => err.toString().includes( 'Fake error message' )
	);
} );

QUnit.test( 'ZObjectBuilder from normal JSON', ( assert ) => {
	const jsonObj = { val: 'Bar' };
	const builder = TestBuilder.fromNormalJSON( jsonObj );
	assert.deepEqual( builder.normalJSON, jsonObj );
	builder.normalJSON.val2 = 'Foo';
	assert.deepEqual( builder.build().normalJSON, { val: 'Bar', val2: 'Foo' } );
	// The downside is that the original obj used will also be modified.
	assert.deepEqual( jsonObj, { val: 'Bar', val2: 'Foo' } );
} );

QUnit.test( 'ZObjectBuilder from another ZObject', ( assert ) => {
	const jsonObj = { val: 'Bar' };
	const origZObj = new TestBuilder().setNormalJSON( jsonObj ).build();
	const builder = TestBuilder.fromZObject( origZObj );
	assert.deepEqual( builder.normalJSON, jsonObj );
	// After modification, the new builer can change (not frozen), and the original
	// ZObject remains unimpacted.
	builder.normalJSON.val2 = 'Foo';
	assert.deepEqual( builder.build().normalJSON, { val: 'Bar', val2: 'Foo' } );
	assert.deepEqual( jsonObj, { val: 'Bar' } );
} );

QUnit.test( 'ZObject immutability', ( assert ) => {
	const jsonObj = { val: 'Bar' };
	const builder = TestBuilder.fromNormalJSON( jsonObj );
	const zObj = builder.build();
	// The already-made ZObject cannot be modified in any capacity.
	assert.throws(
		() => { zObj.normalJSON = { val: 'Foo' }; }
	);
	assert.throws(
		() => { zObj.normalJSON.val = 'Foo'; }
	);
	// The original builder and base JSON can still be modified.
	jsonObj.val2 = 'Foo';
	assert.deepEqual( jsonObj, { val: 'Bar', val2: 'Foo' } );
	assert.deepEqual( jsonObj, builder.normalJSON );
	// This modification does not propagate to the ZObject.
	assert.deepEqual( zObj.normalJSON, { val: 'Bar' } );
} );
