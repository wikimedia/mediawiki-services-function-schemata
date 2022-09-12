'use strict';

const { validatesAsReference } = require( '../src/schema.js' );
const { ValidationStatus } = require( '../src/validationStatus.js' );
const { ZObject, ZObjectBuilder } = require( './zObject.js' );

/**
 * A JS Class representation of the Z9/Reference type.
 */
class Z9Reference extends ZObject {

	/**
	 * @return {string} the ID/Z9K1 of this Z9 (read only).
	 */
	get id() {
		return this._normalJSON.Z9K1;
	}
}

/**
 * A builder for the Z9Reference class.
 */
class Z9Builder extends ZObjectBuilder {

	constructor() {
		super( Z9Reference );
		this.normalJSON.Z1K1 = 'Z9';
	}

	/**
	 * Validates the correctness of the underlying Z9 based on schema rules.
	 *
	 * @return {ValidationStatus}
	 */
	validateZObject() {
		return validatesAsReference( this.normalJSON );
	}

	/**
	 * @param {string} id
	 * @return {Z9Builder} the same Z9Builder with the ID set.
	 */
	setId( id ) {
		this.normalJSON.Z9K1 = id;
		return this;
	}
}

module.exports = { Z9Reference, Z9Builder };
