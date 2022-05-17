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

/**
 * Traverses a Z5/Error object searching for all of the suberror codes in the
 * tree. Returns a set of the codes that were not found.
 *
 * @param {Object} Z5 the Z5/Error
 * @param {Array} codes array of error codes to be searched
 * @return {Set} a set of missing error codes
 */
function getMissingZ5( Z5, codes ) {
	const notFound = new Set( codes );

	traverse( Z5, ( key, value ) => {
		if ( key === 'Z9K1' && notFound.has( value ) ) {
			notFound.delete( value );
		}
	} );

	return notFound;
}

async function testValidation( baseName, validator, testObjects ) {
	// Serialized function calls subsumed in the "success" block should validate
	// successfully.
	const successes = testObjects.success || [];
	for ( let i = 0; i < successes.length; ++i ) {
		const testObject = successes[ i ];
		const name = baseName + ': ' + testObject.name;
		QUnit.test( name, async ( assert ) => {
			const status = await validator.validateStatus( testObject.object );

			assert.true( status.isValid() );
		} );
	}

	// Calls in the "failure" block should not validate successfully.
	const failures = testObjects.failure || [];
	for ( let i = 0; i < failures.length; ++i ) {
		const testObject = failures[ i ];
		const name = baseName + ': ' + testObject.name;
		QUnit.test( name, async ( assert ) => {
			const status = await validator.validateStatus( testObject.object );

			assert.false( status.isValid() );
		} );
	}
}

/**
 * Runs a set of tests on the errors detected during ZObject validation.
 *
 * @param {string} baseName the test set name as defined in the .yaml
 * @param {Object} validator the Ajv validator to be used for the ZObjects
 * @param {Object} testObjects the .yaml object containing test definitions
 * @param {Object} errorValidator the Ajv validator for ZErrors (Z5)
 */
async function testErrors( baseName, validator, testObjects, errorValidator ) {

	// Every test object must return an error on validation.
	// testObjects.slice(13, 14).forEach((testObject) => {
	testObjects.forEach( async ( testObject ) => {
		const name = baseName + ': ' + testObject.name;
		const status = await validator.validateStatus( testObject.object );

		// Check that validator is finding the correct error types
		QUnit.test( `${name}: detection`, ( assert ) => {
			assert.false( status.isValid() );
			assert.notStrictEqual( status.getZ5(), null );

			// Errors detected with every parser (Ajv and Opis):
			const errorCodes = new Set( testObject.errors );

			// Errors detected only with javascript parser (Ajv):
			if ( testObject.js_errors ) {
				errorCodes.add( ...testObject.js_errors );
			}

			traverse( status.getZ5(), ( key, value ) => {
				if ( key === 'Z9K1' && errorCodes.has( value ) ) {
					errorCodes.delete( value );
				}
			} );

			assert.strictEqual( errorCodes.size, 0 );
		} );

		// Check that the detected errors are valid Z5 objects
		QUnit.test( `${name}: wellformedness`, async ( assert ) => {
			const errorStatus = await errorValidator.validateStatus( status.getZ5() );
			assert.true( errorStatus.isValid() );
		} );

	} );
}

/**
 * Runs a set of tests for the given function. The function is expected to
 * return a result envelope where error must be a ZObject.
 *
 * @param {string} baseName the test set name as defined in the .yaml
 * @param {Function} fn the function that will be tested
 * @param {Object} testObjects the .yaml object containing test definitions
 */
async function test( baseName, fn, testObjects ) {
	const successes = testObjects.success || [];
	successes.forEach( async ( testObject ) => {
		await QUnit.test( `${baseName}: ${testObject.name}`, async ( assert ) => {
			const envelope = await fn( testObject.object );
			const data = envelope.Z22K1;
			const metadata = envelope.Z22K2;

			assert.deepEqual( metadata, { Z1K1: 'Z9', Z9K1: 'Z24' } );
			assert.deepEqual( data, testObject.expected );
		} );
	} );

	const errors = testObjects.throws || [];
	errors.forEach( async ( testObject ) => {
		await QUnit.test( `${baseName}: ${testObject.name}`, async ( assert ) => {
			const envelope = await fn( testObject.object );
			const data = envelope.Z22K1;
			const metadata = envelope.Z22K2;

			assert.deepEqual( data, { Z1K1: 'Z9', Z9K1: 'Z24' } );
			assert.deepEqual( metadata.Z1K1, {
				Z1K1: { Z1K1: 'Z9', Z9K1: 'Z7' },
				Z7K1: { Z1K1: 'Z9', Z9K1: 'Z883' },
				Z883K1: { Z1K1: 'Z9', Z9K1: 'Z6' },
				Z883K2: { Z1K1: 'Z9', Z9K1: 'Z1' }
			} );

			const notFound = getMissingZ5( metadata, testObject.errors );

			assert.strictEqual( notFound.size, 0 );
		} );
	} );
}

module.exports = { test, testValidation, testErrors, getMissingZ5 };
