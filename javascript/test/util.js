'use strict';

/**
 * Traverses a ZObject calling the provided callback function for every
 * <key, value> pair. This a depth-first procedure.
 *
 * @param {Object} zobject
 * @param {Function} callback
 */
function traverse( zobject, callback ) {
	if ( zobject !== null && typeof zobject === 'object' ) {
		Object.entries( zobject ).forEach( ( [ key, value ] ) => {
			callback( key, value );
			traverse( value, callback );
		} );
	}
}

function testValidation( baseName, validator, testObjects ) {
	// Serialized function calls subsumed in the "success" block should validate
	// successfully.
	const successes = testObjects.success || [];
	for ( let i = 0; i < successes.length; ++i ) {
		const testObject = successes[ i ];
		const name = baseName + ': ' + testObject.name;
		QUnit.test( name, ( assert ) => {
			const status = validator.validateStatus( testObject.object );

			assert.true( status.isValid() );
		} );
	}

	// Calls in the "failure" block should not validate successfully.
	const failures = testObjects.failure || [];
	for ( let i = 0; i < failures.length; ++i ) {
		const testObject = failures[ i ];
		const name = baseName + ': ' + testObject.name;
		QUnit.test( name, ( assert ) => {
			const status = validator.validateStatus( testObject.object );

			assert.false( status.isValid() );
		} );
	}
}

/**
 * Runs a set of tests on the validation Z5s of a ZObject.
 *
 * @param {string} baseName the test set name as defined in the .yaml
 * @param {Ajv} validator the validator to be used for the ZObjects
 * @param {Object} testObjects the .yaml object containing test definitions
 */
function testZ5( baseName, validator, testObjects ) {
	const failures = testObjects.failure || [];

	// failures.slice(13, 14).forEach((testObject) => {
	failures.forEach( ( testObject ) => {
		const name = baseName + ': ' + testObject.name;
		const status = validator.validateStatus( testObject.object );

		QUnit.test( name, ( assert ) => {
			assert.false( status.isValid() );
			assert.ok( status.getZ5() );

			const errorCodes = new Set( testObject.errors );
			// specific errors expected in JavaScript
			if ( testObject.js_errors ) {
				errorCodes.add( ...testObject.js_errors );
			}

			traverse( status.getZ5(), ( key, value ) => {
				if ( key === 'Z5K1' && errorCodes.has( value ) ) {
					errorCodes.delete( value );
				}
			} );

			assert.equal( errorCodes.size, 0 );
		} );
	} );
}

/**
 * Runs a set of tests for the given function.
 *
 * @param {string} baseName the test set name as defined in the .yaml
 * @param {Function} fn the function that will be tested
 * @param {Object} testObjects the .yaml object containing test definitions
 */
function test( baseName, fn, testObjects ) {
	const successes = testObjects.success || [];
	successes.forEach( ( testObject ) => {
		QUnit.test( `${baseName}: ${testObject.name}`, ( assert ) => {
			assert.deepEqual( fn( testObject.object ), testObject.expected );
		} );
	} );

	const errors = testObjects.throws || [];
	errors.forEach( ( testObject ) => {
		QUnit.test( `${baseName}: ${testObject.name}`, ( assert ) => {
			// TODO: we could have a RegExp as argumento to "throws" for a error message match
			assert.throws( () => fn( testObject.object ) );
		} );
	} );
}

module.exports = { test, testValidation, testZ5 };
