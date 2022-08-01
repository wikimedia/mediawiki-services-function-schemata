'use strict';

const { deepCopy, deepFreeze } = require( '../src/utils.js' );
const { validatesAsReference } = require( '../src/schema.js' );

/**
 * A JS Class representation of the Z9/Reference type.
 *
 * This class is meant to be used in conjunction with the Z9Builder class. Example usages:
 * ex1:
 * const myZ9 = await ( new Z9Builder().setId( 'Z10000' ).build() );
 * const id = myZ9.id;
 * const z9Json = myZ9.normalJSON;
 */
class Z9Reference {

	/**
	 * Creates a new Z9Reference. Please DO NOT call this constructor from outside the Z9Builder
	 * class. This constructor only to be used by the Z9Builder.
	 *
	 * @param {*} normalJSON a JSON object that is the normal representation of the Z9.
	 */
	constructor( normalJSON ) {
		// The underlying JSON object that represents this Z9/Reference, in normal form.
		// It is marked as "private" so that this class can be immutable once instantiated.
		// TODO: once the eslint ecmaVersion can be updated to 13+, we can use the builtin
		// private syntax.
		this._normalJSON = deepCopy( normalJSON );
	}

	/**
	 * @return {string} the ID/Z9K1 of this Z9 (read only).
	 */
	get id() {
		return this._normalJSON.Z9K1;
	}

	/**
	 * @return {*} the underlying JSON object that represents this Z9 in the normal form
	 *     (read only);
	 */
	get normalJSON() {
		return this._normalJSON;
	}

}

/**
 * A builder for the Z9Reference class.
 *
 * This should be the only point-of-entry for creating a Z9Reference. It provides convenient
 * parameter setting syntax and a guarantee of correctness. Examples of usage:
 *
 * ex1: const myZ9 = await ( new Z9Builder().setId( 'Z10000' ).build() );
 * ex2: const myZ9 = await ( Z9Builder.fromZ9Reference( existingZ9 ).build() );
 * ex3: const myZ9 = await ( Z9Builder.fromNormalJSON( { Z1K1: 'Z9', Z9K1: 'Z10000' } ).build() );
 */
class Z9Builder {

	constructor() {
		this.Z1K1 = 'Z9';
		this.Z9K1 = undefined;
	}

	/**
	 * @param {string} id
	 * @return {Z9Builder} the same Z9Builder with the ID set.
	 */
	setId( id ) {
		this.Z9K1 = id;
		return this;
	}

	/**
	 * @param {*} normalJSON
	 * @return {Z9Builder} a new Z9Builder based on the normal JSON of an existing Z9.
	 */
	static fromNormalJSON( normalJSON ) {
		const newBuilder = new Z9Builder();
		Object.keys( normalJSON ).forEach( ( key ) => {
			newBuilder[ key ] = normalJSON[ key ];
		} );
		return newBuilder;
	}

	/**
	 * @param {Z9Reference} z9
	 * @return {Z9Builder} a new Z9Builder based on an existing Z9Reference.
	 */
	static fromZ9Reference( z9 ) {
		return Z9Builder.fromNormalJSON( z9.normalJSON );
	}

	/**
	 * @return {*} the normal JSON representation of the Z9 that this builder prepares for.
	 */
	get normalJSON() {
		const normalJSON = {};
		Object.keys( this ).forEach( ( key ) => {
			normalJSON[ key ] = this[ key ];
		} );
		return normalJSON;
	}

	/**
	 * Builds an immutable Z9Reference based on the current state of the builder, after
	 * validating its correctness. Note that this method is async because the validation function
	 * is async.
	 *
	 * @return {Z9Reference} a validated Z9Reference.
	 */
	async build() {
		const normalJSON = this.normalJSON;

		const validationStatus = await validatesAsReference( normalJSON );
		if ( !validationStatus.isValid() ) {
			throw new Error( 'Eeek! Validation failed. Cannot create Z9Reference.' );
		}
		return deepFreeze( new Z9Reference( normalJSON ) );
	}
}

module.exports = { Z9Reference, Z9Builder };
