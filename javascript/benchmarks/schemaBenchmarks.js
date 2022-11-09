/**
 * Script to run a sample benchmark suite for functionalities exported by
 * schema.js.
 *
 * How to use:
 * `node path/to/schemaBenchmarks.js`
 * OR
 * `npm run benchmark`
 * to run all benchmark suites
 *
 * Result will look like:
 * ```
 * validateAsZObject x 198,127 ops/sec ±0.34% (93 runs sampled)
 * validatesAsFunctionCall x 504,850 ops/sec ±0.24% (93 runs sampled)
 * validatesAsArgumentReference x 1,042,262 ops/sec ±0.22% (96 runs sampled)
 * ZObjectKeyFactory with normal Z7 x 1,019 ops/sec ±1.93% (88 runs sampled)
 * ZObjectKeyFactory with invalid object x 54,151 ops/sec ±1.06% (87 runs sampled)
 * ```
 *
 * The higher the number (X ops/sec), the faster it is.
 */

'use strict';

const Benchmark = require( 'benchmark' );
const { ZObjectKeyFactory, validatesAsZObject, validatesAsFunctionCall, validatesAsArgumentReference } = require( '../src/schema' );

const suite = new Benchmark.Suite( 'Benchmark suite for schema and its functionalities',
	{
		onCycle: ( event ) => {
			console.log( String( event.target ) );
		}
	} );

suite.add( 'validateAsZObject', () => {
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
	console.assert(
		validatesAsZObject( input ).isValid(),
		'Expected the validatesAsZObject result to be valid but failed. \
The benchmark might be incorrectly set up' );
} );

suite.add( 'validatesAsFunctionCall', () => {
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
	console.assert(
		validatesAsFunctionCall( input ).isValid(),
		'Expected the validatesAsZObject result to be valid but failed. \
The benchmark might be incorrectly set up' );
} );

suite.add( 'validatesAsArgumentReference', () => {
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
	console.assert(
		validatesAsArgumentReference( input ).isValid(),
		'Expected the validatesAsZObject result to be valid but failed. \
The benchmark might be incorrectly set up' );
} );

suite.add( 'ZObjectKeyFactory with normal Z7', () => {
	// A type containing K1: list of strings and K2: Boolean.
	const theType = {
		Z1K1: 'Z7',
		Z7K1: 'Z50000',
		Z50000K1: {
			Z1K1: 'Z7',
			Z7K1: 'Z881',
			Z881K1: 'Z6'
		},
		Z50000K2: 'Z40'
	};
	// The input has the above-specified type.
	const theInput = {
		Z1K1: theType,
		K1: [ 'Z6' ],
		K2: {
			Z1K1: 'Z40',
			Z40K1: 'Z42'
		}
	};
	const Z1 = {
		Z1K1: 'Z7',
		Z7K1: {
			Z1K1: 'Z8',
			Z8K1: [
				'Z17'
			],
			Z8K2: theType,
			Z8K3: [ 'Z20' ],
			Z8K4: [
				'Z14',
				{
					Z1K1: 'Z14',
					Z14K1: 'Z50002',
					Z14K2: {
						Z1K1: 'Z7',
						Z7K1: 'Z801',
						Z801K1: theInput
					}
				}
			],
			Z8K5: 'Z50002'
		}
	};
	const theResult = ZObjectKeyFactory.create( Z1, true ).asString();
	console.assert(
		theResult.includes( 'Z50002' ),
		`Expected result to include Z50002 but got ${theResult}. Even though this is just a \
benchmark run, faulty results might indicate the expected sequence wasn't run correctly.` );
} );

suite.add( 'ZObjectKeyFactory with invalid object', () => {
	const invalidZObject = {
		Hello: 'Molly',
		This: 'is Louis, Molly'
	};
	let failedResponse;
	try {
		failedResponse = ZObjectKeyFactory.create( invalidZObject ).asString();
	} catch ( error ) {
		// do nothing
	}
	// If we've set a response then something went wrong in going wrong.
	console.assert(
		failedResponse === undefined,
		`Expects the response to be undefined, but got ${failedResponse}. This means \
The benchmark setup is incorrect in someway.` );
} );

suite.run();
