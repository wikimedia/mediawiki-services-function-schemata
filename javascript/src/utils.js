/* eslint-disable camelcase */
'use strict';

const fs = require('fs');
const yaml = require('yaml');

function is_string(s) {
	return typeof s === 'string' || s instanceof String;
}

function is_array(a) {
	return Array.isArray(a);
}

function is_object(o) {
	return !is_array(o) && typeof o === 'object' && o !== null;
}

function is_key(k) {
	return k.match(/^(Z[1-9]\d*)?K[1-9]\d*$/) !== null;
}

function is_zid(k) {
	return k.match(/^Z[1-9]\d*$/) !== null;
}

function is_reference(z) {
	return z.match(/^[A-Z][1-9]\d*$/) !== null;
}

function is_global_key(k) {
	return k.match(/^Z[1-9]\d*K[1-9]\d*$/) !== null;
}

function kid_from_global_key(k) {
	return k.match(/^Z[1-9]\d*(K[1-9]\d*)$/)[1];
}

function deep_equal(o1, o2) {
	// TODO: use something more robust
	return JSON.stringify(o1) === JSON.stringify(o2);
}

function deep_copy(o) {
	return JSON.parse(JSON.stringify(o));
}

/**
 * Determines whether an already-validated Z10 is empty. Because the Z10 has
 * already been validated, it is sufficient to check for the presence of Z10K1.
 *
 * @param {Object} Z10 a Z10 List
 * @return {bool} whether Z10 is empty
 */
function isEmpty(Z10) {
	return Z10.Z10K1 === undefined;
}

/**
 * Turns a JS array into a Z10.
 *
 * @param {Object} Z10 a Z10 list
 * @return {Array} an array consisting of all Z10K1s in the Z10
 */
function Z10ToArray(Z10) {
	if (isEmpty(Z10)) {
		return [];
	}
	return [Z10.Z10K1].concat(Z10ToArray(Z10.Z10K2));
}

/**
 * Turns a Z10 into a JS array for ease of iteration.
 *
 * @param {Array} array an array of ZObjects
 * @return {Object} a Z10 List corresponding to the input array
 */
function arrayToZ10(array) {
	const length = array.length;
	if (length <= 0) {
		return { Z1K1: { Z1K1: 'Z9', Z9K1: 'Z10' } };
	}
	return {
		Z1K1: {
			Z1K1: 'Z9',
			Z9K1: 'Z10',
		},
		Z10K1: array[0],
		Z10K2: arrayToZ10(array.slice(1, length)),
	};
}

function readYaml(fileName) {
	const text = fs.readFileSync(fileName, { encoding: 'utf8' });
	return yaml.parse(text);
}

module.exports = {
	is_string,
	is_array,
	is_object,
	is_key,
	is_zid,
	is_reference,
	is_global_key,
	kid_from_global_key,
	deep_equal,
	deep_copy,
	isEmpty,
	Z10ToArray,
	arrayToZ10,
	readYaml,
};
