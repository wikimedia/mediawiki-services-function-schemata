'use strict';

const { validatesAsZObject } = require( '../src/schema.js' );
const { ZObject, ZObjectBuilder } = require( './zObject.js' );

/**
 * A JS Class representation of a generic Z1/Object.
 */
class Z1Object extends ZObject { }

/**
 * A builder for the Z9Reference class.
 */
class Z1Builder extends ZObjectBuilder {
	constructor() {
		super( Z1Object );
	}

	/**
	 * Validates the correctness of the underlying Z1Object based on schema rules.
	 *
	 * @return {Promise<boolean>}
	 */
	validateZObject() {
		return validatesAsZObject( this.normalJSON );
	}
}

module.exports = { Z1Object, Z1Builder };
