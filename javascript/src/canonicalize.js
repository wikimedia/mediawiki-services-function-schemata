'use strict';

/* eslint no-use-before-define: ["error", { "functions": false }] */

const { error } = require('./error.js');
const { is_string, is_array, is_reference, Z10ToArray } = require('./utils.js'); // eslint-disable-line camelcase
const { SchemaFactory } = require('./schema');

const normalFactory = SchemaFactory.NORMAL();
const normalZ1Validator = normalFactory.create('Z1');
const Z6Validator = normalFactory.create('Z6');
const Z9Validator = normalFactory.create('Z9');
const Z10Validator = normalFactory.create('Z10');

function canonicalizeArray(a) {
	return a.map(canonicalize);
}

function canonicalizeObject(o) {
	if (Z9Validator.validate(o)) {
		o.Z9K1 = canonicalize(o.Z9K1);

		// return as string if Z9K1 is a valid reference string
		if (is_string(o.Z9K1) && is_reference(o.Z9K1)) {
			return o.Z9K1;
		}
	}

	if (Z6Validator.validate(o)) {
		o.Z6K1 = canonicalize(o.Z6K1);

		// return as string if Z6/String doesn't need to be escaped, i.e., is not in Zxxxx format
		if (is_string(o.Z6K1) && !is_reference(o.Z6K1)) {
			return o.Z6K1;
		}
	}

	if (Z10Validator.validate(o)) {
		return Z10ToArray(o).map(canonicalize);
	}

	o.Z1K1 = canonicalize(o.Z1K1);

	if (o.Z1K1 === 'Z5' &&
		(o.Z5K1.Z1K1 === error.syntax_error || o.Z5K1.Z1K1 === error.not_wellformed)) {
		return o;
	}

	const keys = Object.keys(o);
	const result = {};

	for (let i = 0; i < keys.length; i++) {
		result[ keys[ i ] ] = canonicalize(o[ keys[ i ] ]);
	}
	return result;
}

// the input is assumed to be a well-formed ZObject, or else the behaviour is undefined
function canonicalize(o) {
	if (is_string(o)) {
		return o;
	}

	if (is_array(o)) {
		return canonicalizeArray(o);
	}

	return canonicalizeObject(o);
}

/**
 * Canonicalizes a normalized ZObject.
 *
 * @param {Object} o a ZObject
 * @return {Object} the canonical ZObject
 * @throws {Error} throws if argument "o" is not in normal form
 */
function canonicalizeExport(o) {
	if (!normalZ1Validator.validate(o)) {
		throw new Error('canonicalize: argument "o" is not a normalized ZObject.');
	}

	return canonicalize(o);
}

module.exports = canonicalizeExport;
