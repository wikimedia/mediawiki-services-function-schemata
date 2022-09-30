'use strict';

const { deepCopy, deepFreeze } = require( '../src/utils.js' );
// const { validatesAsZObject } = require( '../src/schema.js' );

/**
 * A JS Class representation of an abstract ZObject. Most other Z-types will
 * inherit from this. It provides a general outline of ZObject APIs and
 * some boilderplate functionalities, but it should not be instantiated directly.
 *
 * This class is meant to be used in conjunction with the ZObjectBuilder class.
 * No ZObject child object should be instantiated without the builder because
 * the builder provides validation and immutability.
 * Example usages:
 * const myZ1 = new Z1Builder().setNormalJSON( jsonObj ).build();
 * const z1Json = myZ1.normalJSON;
 */
class ZObject {
	constructor( normalJSON ) {
		if ( this.constructor === ZObject ) {
			throw new Error( 'The abstract ZObject class cannot be instantiated.' );
		}
		// The underlying JSON style object that represents this ZObject, in normal form.
		// It is marked as "private" so that this class can be immutable once instantiated.
		// TODO: once the eslint ecmaVersion can be updated to 13+, we can use the builtin
		// private syntax.
		this._normalJSON = deepCopy( normalJSON );
	}

	/**
	 * @return {*} the underlying JSON object that represents this Z1 in the normal form
	 *     (read only);
	 */
	get normalJSON() {
		return this._normalJSON;
	}
}

/**
 * An abstract builder for a ZObject JS class. Most other Z-types will
 * inherit from this. It provides some common APIs and boilerplate
 * functionalities, but do not instantiate a concrete instance of this
 * abstract class. Instantiate its child classes instead.
 *
 * A builder should be the only point-of-entry for creating any ZObject
 * class. It provides the necessary type validation and immutability guard.
 *
 * Example usage for a concrete ZObjectBuilder:
 * const firstZ9 = new Z9Builder().setId('Z10000').build();
 * const secondZ9 = Z9Builder.fromZObject(firstZ9).build();
 * const thirdZ9 = Z9Builder.fromNormalJSON({Z1K1: Z9, Z9K1: 'Z10000'}).build();
 */
class ZObjectBuilder {

	/**
	 * MUST OVERRIDE. Creates a concrete ZObjectBuilder subclass object. Note that this base class
	 * cannot be instantiated.
	 *
	 * Examples for overriding this class:
	 * class Z42Builder extends ZObjectBuilder{ constructor() { super(Z42) } }
	 *
	 * @param {ZObject.constructor} zObjectClass A child class of ZObject that this builder is
	 *     affiliated with.
	 */
	constructor( zObjectClass ) {
		if ( this.constructor === ZObjectBuilder ) {
			throw new Error( 'The abstract ZObjectBuilder class cannot be instantiated. ' );
		}
		this._zObjectClass = zObjectClass;
		this.normalJSON = {};
	}

	/**
	 * A static constructor for ZObjectBuilder (or more accurately, its concrete child class)
	 * based on an existing normalJSON.
	 *
	 * Note that if this builder gets modified, e.g. a field gets updated, so will the json obj
	 * used as the template. If you pass in the normalJSON field of an existing ZObject, there
	 * will be problems as ZObjects are all deeply frozen. If this is a use case you want, get
	 * a deepCopy of the object, or use the fromZObject() method instead.
	 *
	 * Usage: const builder = Z9Builder.fromNormalJSON(json).build()
	 *
	 * @param {*} normalJSON
	 * @return {ZObjectBuilder} A new ZObjectBuilder's child object based on the normalJSON.
	 */
	static fromNormalJSON( normalJSON ) {
		let newBuilder = new this();
		newBuilder = newBuilder.setNormalJSON( normalJSON );
		return newBuilder;
	}

	/**
	 * A static constructor for ZObjectBuilder (or more accurately, its concrete child class)
	 * based on an existing ZObject of the same kind. Note that the content of
	 * the original object will be deep copied to ensure mutability (frozen otherwise).
	 *
	 * @param {ZObject} zObj an existing ZObject serving as the base template for the new builder.
	 * @return {ZObjectBuilder} A new ZObjectBuilder's child object based on the existing ZObject.
	 */
	static fromZObject( zObj ) {
		return this.fromNormalJSON( deepCopy( zObj.normalJSON ) );
	}

	/**
	 * @param {*} normalJSON
	 * @return {ZObjectBuilder} the same builder with its underlying JSON set.
	 */
	setNormalJSON( normalJSON ) {
		this.normalJSON = normalJSON;
		return this;
	}

	/**
	 * MUST OVERRIDE. Validates the correctness of the underlying ZObject based on
	 * schema rules. Child classes should override this method to using its specific
	 * validator. It should return a ValidationStatus object.
	 */
	validateZObject() {
		// Should the default behavior be to use the Z1 validator?
		throw new Error( 'The validateZObject method has not yet been defined for this builder.' );
	}

	/**
	 * Builds an immutable ZObject based on the current state of the builder, after
	 * validating its correctness.
	 *
	 * @return {ZObject} a validated ZObject.
	 */
	build() {
		const validationStatus = this.validateZObject();
		if ( !validationStatus.isValid() ) {
			throw new Error(
				`Validation failed. Cannot create ZObject. ${validationStatus.getZ5}` );
		}
		return deepFreeze( new this._zObjectClass( this.normalJSON ) );
	}
}

module.exports = { ZObject, ZObjectBuilder };
