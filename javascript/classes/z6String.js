'use strict';

const { validatesAsString } = require( '../src/schema.js' );
const { ValidationStatus } = require( '../src/validationStatus.js' );
const { ZObject, ZObjectBuilder } = require( './zObject.js' );

/**
 * A JS Class representation of the Z6/String type.
 */
class Z6String extends ZObject {

	/**
	 * @return {string} the string value of this Z6 (read only).
	 */
	get value() {
		return this._normalJSON.Z6K1;
	}
}

/**
 * A builder for the Z6String class.
 */
class Z6Builder extends ZObjectBuilder {

	constructor() {
		super( Z6String );
		this.normalJSON.Z1K1 = 'Z6';
	}

	/**
	 * Validates the correctness of the underlying Z6 based on schema rules.
	 *
	 * @return {ValidationStatus}
	 */
	validateZObject() {
		return validatesAsString( this.normalJSON );
	}

	/**
	 * @param {string} str
	 * @return {Z6Builder} the same Z6Builder with the value set.
	 */
	setValue( str ) {
		this.normalJSON.Z6K1 = str;
		return this;
	}
}

module.exports = { Z6String, Z6Builder };
