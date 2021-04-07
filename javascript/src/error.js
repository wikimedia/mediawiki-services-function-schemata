'use strict';

function innerError(codes, args) {
	if (codes.length === 1) {
		const errorObject = {
			Z1K1: codes[ 0 ]
		};
		for (let i = 0; i < args.length; i++) {
			errorObject[ codes + 'K' + (i + 1).toString() ] = args[ i ];
		}
		return errorObject;
	} else {
		return {
			Z1K1: codes[ 0 ],
			[ codes[ 0 ] + 'K1' ]: innerError(codes.slice(1), args)
		};
	}
}

function canonicalError(codes, args) {
	// TODO: Create normalized error types and helpers.
	return {
		Z1K1: 'Z5',
		Z5K1: innerError(codes, args)
	};
}

const error = {
	syntax_error: 'Z401', // message from parser, input string
	not_wellformed: 'Z402', // sub error code, maybe more
	not_implemented_yet: 'Z403', // function name
	zid_not_found: 'Z404', // zid
	number_of_arguments_mismatch: 'Z405', // expected number, actual number, args
	argument_type_error: 'Z406', // expected type, actual type, arg
	error_in_evaluation: 'Z407', // function call
	competing_keys: 'Z408', // object
	nil: 'Z410', // -
	key_not_found: 'Z411', // key reference, object
	z9_error: 'Z412', // object
	resolved_object_without_z2k2: 'Z413', // resolved object
	builtin_does_not_exist: 'Z414', // implementation
	builtin_id_error: 'Z415', // implementation
	argument_value_error: 'Z416', // key, bad value

	zobject_must_not_be_number_or_boolean_or_null: 'Z421', // offending text (sub of Z402)
	array_element_not_well_formed: 'Z422', // offending index in array, propagated error (sub of Z402)
	missing_type: 'Z423', // no Z1K1 (sub of Z402)
	z1k1_must_not_be_string_or_array: 'Z424', // value of z1k1 (sub of 402)
	invalid_key: 'Z425', // invalid key (sub of 402)
	not_wellformed_value: 'Z426', // key, propagated error (sub of 402)

	z6_must_have_2_keys: 'Z431', // whole object
	z6_without_z6k1: 'Z432', // whole object
	z6k1_must_be_string: 'Z433', // value of Z6K1
	z9_must_have_2_keys: 'Z434', // whole object
	z9_without_z9k1: 'Z435', // whole object
	z9k1_must_be_string: 'Z436', // value of Z9K1
	z9k1_must_be_reference: 'Z437', // value of Z9K1
};

module.exports = {
	error,
	canonicalError
};
