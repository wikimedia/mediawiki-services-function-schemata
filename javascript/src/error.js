'use strict';

const { isString, isZid, wrapInZ6, wrapInZ9 } = require( './utils.js' );

/**
 * Generate a Z5/ZError instance of a given type with its arguments, in canonical form.
 *
 * This code does not validate the inputs. Checking that the given ZID refers to a known
 * Z50/ZErrorType, that the supplied arguments relate to the given error code, or that the
 * arguments are in the appropriate form or wrapped in a Z99/ZQuote is left to callers.
 *
 * @param {string} errorType The ZID of the ZErrorType to generate
 * @param {Array} [args] The relevant arguments, if any
 * @return {Object} A Z5/ZError instance in canonical form
 * @throws Will throw an error if the error type is not valid
 */
function makeErrorInCanonicalForm( errorType, args = [] ) {
	return makeErrorInGivenForm( errorType, args, true );
}

/**
 * Generate a Z5/ZError instance of a given type with its arguments, in normal form.
 *
 * This code does not validate the inputs. Checking that the given ZID refers to a known
 * Z50/ZErrorType, that the supplied arguments relate to the given error code, or that the
 * arguments are in the appropriate form or wrapped in a Z99/ZQuote is left to callers.
 *
 * @param {string} errorType The ZID of the Z50/ZErrorType to generate
 * @param {Array} [args] The relevant arguments, if any
 * @return {Object} A Z5/ZError instance in normal form
 * @throws Will throw an error if the error type is not valid
 */
function makeErrorInNormalForm( errorType, args = [] ) {
	return makeErrorInGivenForm( errorType, args, false );
}

/**
 * Internal implementation function for makeErrorInCanonicalForm() and makeErrorInNormalForm()
 *
 * @param {string} errorType The ZID of the Z50/ZErrorType to generate
 * @param {Array} args The relevant arguments, if any
 * @param {boolean} canonical Whether to output in canonical or normal form
 * @return {Object} A Z5/ZError instance in either canonical or normal form
 */
function makeErrorInGivenForm( errorType, args, canonical ) {
	if ( !isString( errorType ) ) {
		throw new Error( 'Missing error type.' );
	}

	if ( !isZid( errorType ) ) {
		throw new Error( `Invalid error type: "${errorType}".` );
	}

	const baseError = {
		Z1K1: canonical ? 'Z5' : wrapInZ9( 'Z5' ),
		Z5K1: canonical ? errorType : wrapInZ9( errorType ),
		Z5K2: {
			Z1K1: {
				Z1K1: canonical ? 'Z7' : wrapInZ9( 'Z7' ),
				Z7K1: canonical ? 'Z885' : wrapInZ9( 'Z885' ),
				Z885K1: canonical ? errorType : wrapInZ9( errorType )
			}
		}
	};

	for ( let index = 0; index < args.length; index++ ) {
		let argument = args[ index ];
		argument = !canonical && ( typeof argument === 'string' ) ? wrapInZ6( argument ) : argument;

		baseError.Z5K2[ ( errorType + 'K' + ( index + 1 ) ) ] = argument;
	}

	return baseError;
}

const error = {
	unknown_error: 'Z500', // error information
	// Deprecated name
	generic_error: 'Z500', // error information
	syntax_error: 'Z501', // message from parser, input string
	not_wellformed: 'Z502', // sub error code, maybe more
	not_implemented_yet: 'Z503', // function name
	zid_not_found: 'Z504', // zid
	number_of_arguments_mismatch: 'Z505', // expected number, actual number, args
	argument_type_mismatch: 'Z506', // expected type, actual type, arg, propagated error
	error_in_evaluation: 'Z507', // function call, propagated error
	competing_keys: 'Z508', // object
	list_of_errors: 'Z509', // list of errors
	nil: 'Z510', // -
	key_not_found: 'Z511', // key reference, object
	test_failed: 'Z512', // expected result, actual result
	resolved_object_without_z2k2: 'Z513', // resolved object
	builtin_does_not_exist: 'Z514', // implementation
	builtin_id_error: 'Z515', // implementation
	argument_value_error: 'Z516', // key, bad value
	return_type_mismatch: 'Z517', // expected type, actual type, returned value, propagated error
	object_type_mismatch: 'Z518', // expected type, object, propagated error

	zobject_must_not_be_number_or_boolean_or_null: 'Z521', // offending text (sub of Z502)
	array_element_not_well_formed: 'Z522', // offending index in array, propagated error (sub of Z502)
	missing_type: 'Z523', // no Z1K1 (sub of Z502)
	z1k1_must_not_be_string_or_array: 'Z524', // value of z1k1 (sub of 402)
	invalid_key: 'Z525', // invalid key (sub of 402)
	not_wellformed_value: 'Z526', // key, propagated error (sub of 402)

	z6_must_have_2_keys: 'Z531', // whole object
	z6_without_z6k1: 'Z532', // whole object
	z6k1_must_be_string: 'Z533', // value of Z6K1
	z9_must_have_2_keys: 'Z534', // whole object
	z9_without_z9k1: 'Z535', // whole object
	z9k1_must_be_string: 'Z536', // value of Z9K1
	z9k1_must_be_reference: 'Z537', // value of Z9K1

	wrong_namespace: 'Z538',
	wrong_content_type: 'Z539',
	invalid_language_code: 'Z540',
	language_code_not_found: 'Z541',
	unexpected_zobject_type: 'Z542',
	type_not_found: 'Z543',
	conflicting_type_names: 'Z544',
	conflicting_type_zids: 'Z545',
	builtin_type_not_found: 'Z546',
	invalid_format: 'Z547',
	invalid_json: 'Z548',
	invalid_zreference: 'Z549',
	unknown_zreference: 'Z550',
	schema_type_mismatch: 'Z551',
	disallowed_root_object: 'Z553',
	invalid_programming_language: 'Z558'
};

module.exports = {
	error,
	makeErrorInCanonicalForm,
	makeErrorInNormalForm
};
