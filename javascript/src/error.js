'use strict';

function innerError( codes, args, normalized = false ) {
	const z1k1 = normalized ?
		{ Z1K1: 'Z9', Z9K1: codes[ 0 ] } :
		codes[ 0 ];

	if ( codes.length === 1 ) {
		const errorObject = {
			Z1K1: z1k1
		};
		for ( let i = 0; i < args.length; i++ ) {
			errorObject[ codes + 'K' + ( i + 1 ).toString() ] = args[ i ];
		}
		return errorObject;
	} else {
		return {
			Z1K1: z1k1,
			[ codes[ 0 ] + 'K1' ]: innerError( codes.slice( 1 ), args )
		};
	}
}

/**
 * A helper function that takes error codes and error arguments and creates a Z5/Error in canonical
 * form. When codes.length > 1, arguments refer to the last error code informed.
 * The arguments are not validated!
 *
 * @param {Array} codes An array of error codes Zxxx
 * @param {Array} args The arguments of the last error in 'codes'
 * @return {Object}
 */
function canonicalError( codes, args ) {
	return {
		Z1K1: 'Z5',
		Z5K1: innerError( codes, args )
	};
}

/**
 * A helper function that takes error codes and error arguments and creates a Z5/Error in normal
 * form.
 * The arguments are not validated!
 *
 * @param {Array} codes An array of error codes Zxxx
 * @param {Array} args The arguments of the last error in 'codes'
 * @return {Object}
 */
function normalError( codes, args ) {
	const argsZ6 = args.map( ( el ) =>
		typeof el === 'string' ? { Z1K1: 'Z6', Z6K1: el } : el
	);

	return {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z5'
		},
		Z5K1: innerError( codes, argsZ6, true )
	};
}

const error = {
	syntax_error: 'Z501', // message from parser, input string
	not_wellformed: 'Z502', // sub error code, maybe more
	not_implemented_yet: 'Z503', // function name
	zid_not_found: 'Z504', // zid
	number_of_arguments_mismatch: 'Z505', // expected number, actual number, args
	argument_type_mismatch: 'Z506', // expected type, actual type, arg, propagated error
	error_in_evaluation: 'Z507', // function call
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
	disallowed_root_object: 'Z553'
};

module.exports = {
	error,
	canonicalError,
	normalError
};
