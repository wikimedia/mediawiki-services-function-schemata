'use strict';

const { arrayToZ10, wrapInZ6, wrapInZ9, wrapInKeyReference, wrapInQuote } = require( './utils.js' );
const { dataDir, readYaml } = require( './fileUtils.js' );
const errorTypes = require( './error.js' );

class ErrorFormatter {

	/**
	 * Read and parse the yaml file with the error type descriptors
	 *
	 * @return {Array}
	 */
	static get errorDescriptors() {
		if ( !this._errorDescriptors ) {
			const descriptorPath = dataDir( 'errors', 'error_types.yaml' );
			this._errorDescriptors = readYaml( descriptorPath ).patterns.keywords;
		}

		return this._errorDescriptors;
	}

	/**
	 * Root function to transform an array of Ajv error objects to a root Z5
	 * object with all the nested errors identified by the builtin
	 * ZErrorTypes (Z50).
	 *
	 * @param {Array} errors
	 * @return {Object}
	 */
	static createRootZError( errors ) {
		const Z5s = [];
		// descriptors found for parser errors
		const descriptors = [];

		for ( const error of errors ) {
			const descriptor = this.matchDescriptor( error );
			// Ajv returns duplicates, so we need to check for them and ignore
			const isDuplicate = descriptors.find(
				( d ) => d.path === error.instancePath && d.descriptor === descriptor
			);

			if ( descriptor && !isDuplicate ) {
				descriptors.push( { path: error.instancePath, descriptor } );

				Z5s.push( [
					error,
					this.createZErrorInstance( descriptor.errorType, error )
				] );
			}
		}

		const errorTree = this.buildErrorTree( Z5s );

		if ( errorTree.children.length === 0 && errorTree.errors.length === 0 ) {
			return null;
		} else {
			return this.getZObjectFromErrorTree( errorTree );
		}
	}

	/**
	 * Builds a tree of errors from a list of Z5s. Each node indicates where the
	 * errors ocurred in the data object. Each Z5 is associated with one of the
	 * nodes. Z5s can be associated to nodes that are not leaves. The function
	 * returns the root object of the tree.
	 *
	 * @param {Array} Z5s
	 * @return {Object}
	 */
	static buildErrorTree( Z5s ) {
		const root = {
			key: 'root',
			children: {},
			errors: []
		};

		for ( const [ parserError, Z5 ] of Z5s ) {
			// only ZnKn are considered as part of the path
			const path = parserError.instancePath.match( /\bZ\d+K\d+\b/g );

			// no path means it's a root error
			if ( !path || path.length === 0 ) {
				root.errors.push( Z5 );
			} else {
				// find the leaf node based on the path creating intermediary nodes if required
				const leaf = path.reduce( ( node, key ) => {
					if ( !node.children[ key ] ) {
						node.children[ key ] = {
							key,
							children: {},
							errors: []
						};
					}

					return node.children[ key ];
				}, root );

				leaf.errors.push( Z5 );
			}
		}

		return root;
	}

	/**
	 * Transforms a tree of errors in a single Z5 object. Z5s are aggregated
	 * into multiple errors/Z509 and non-leaf nodes wrap those errors in not
	 * wellformed/Z526.
	 *
	 * @param {Object} root
	 * @return {Object}
	 */
	static getZObjectFromErrorTree( root ) {
		const children = Object.values( root.children );

		const childrenErrors = [];
		for ( const child of children ) {
			childrenErrors.push( this.getZObjectFromErrorTree( child ) );
		}
		childrenErrors.push( ...root.errors );

		const aggregatedZ5 = childrenErrors.length === 1 ?
			childrenErrors[ 0 ] :
			this.createZErrorList( childrenErrors );

		return root.key === 'root' ?
			this.createValidationZError( aggregatedZ5 ) :
			this.createZKeyError( root.key, aggregatedZ5 );
	}

	/**
	 * Create a ZError (Z5) of the type "Key not wellformed" (Z526)
	 *
	 * @param {string} key
	 * @param {Object} Z5
	 * @return {Object}
	 */
	static createZKeyError( key, Z5 ) {
		return this.createZErrorInstance(
			errorTypes.error.not_wellformed_value,
			{
				key: key,
				value: Z5
			}
		);
	}

	/**
	 * Create a ZError (Z5) of the type "Not wellformed" (Z502)
	 *
	 * @param {Object} Z5
	 * @return {Object}
	 */
	static createValidationZError( Z5 ) {
		return this.createZErrorInstance(
			errorTypes.error.not_wellformed,
			{
				subtype: Z5.Z5K1,
				value: Z5
			}
		);
	}

	/**
	 * Create a ZError (Z5) of the type "Multiple errors" (Z509)
	 *
	 * @param {*} array
	 * @return {Object|null}
	 */
	static createZErrorList( array ) {
		return this.createZErrorInstance(
			errorTypes.error.list_of_errors,
			{
				list: arrayToZ10( array )
			}
		);
	}

	/**
	 * Matches an Ajv parser error to one of the error descriptors in
	 * Wikifunctions. When no descriptor is found for an error, the
	 * function returns null.
	 *
	 * @param {Object} err
	 * @return {Object|null}
	 */
	static matchDescriptor( err ) {
		const candidates = this.errorDescriptors[ err.keyword ];

		if ( candidates ) {
			return candidates.find( ( descriptor ) => {
				switch ( err.keyword ) {
					case 'type':
						return this.matchTypeDescriptor( descriptor, err );
					case 'required':
						return !descriptor.keywordArgs.missing ||
							descriptor.keywordArgs.missing === err.params.missingProperty;
					case 'additionalProperties':
						return true;
					default: return false;
				}
			} );
		}

		return null;
	}

	/**
	 * Evaluates whether a error descriptor matches the given Ajv parser error of
	 * the "type" kind.
	 *
	 * @param {Object} descriptor
	 * @param {Object} err
	 * @return {boolean}
	 */
	static matchTypeDescriptor( descriptor, err ) {
		// if dataPointer is specified but not found in the actual data path
		if ( descriptor.dataPointer.length > 0 &&
			!err.instancePath.endsWith( descriptor.dataPointer[ 0 ] ) ) {
			return false;
		}

		if ( descriptor.keywordArgs.used ) {
			const dataType = typeof err.data;
			let expandedType;

			if ( Array.isArray( err.data ) ) {
				expandedType = 'array';
			} else if ( err.data === null ) {
				expandedType = 'null';
			} else {
				expandedType = dataType;
			}

			return descriptor.keywordArgs.used.includes( expandedType );
		}

		return descriptor.keywordArgs.expected === err.params.type;
	}

	/**
	 * Creates an instance of a generic error given its errorType and an array
	 * with the values of its keys.
	 *
	 * @param {string} errorType
	 * @param {Object} errorKeys
	 * @return {Object}
	 */
	static createGenericError( errorType, errorKeys ) {
		const genericError = {
			Z1K1: {
				Z1K1: wrapInZ9( 'Z7' ),
				Z7K1: wrapInZ9( 'Z885' ),
				Z885K1: wrapInZ9( errorType )
			}
		};

		for ( let index = 0; index < errorKeys.length; index++ ) {
			genericError[ `K${index + 1}` ] = errorKeys[ index ];
		}

		return genericError;
	}

	/**
	 * Create a ZError (Z5) of a given ZErrorType
	 *
	 * @param {string} errorType
	 * @param {Object} err
	 * @return {Object}
	 */
	static createZErrorInstance( errorType, err ) {
		const errorKeys = [];

		switch ( errorType ) {
			case errorTypes.error.not_wellformed:
				errorKeys.push( err.subtype );
				errorKeys.push( err.value );
				break;

			case errorTypes.error.list_of_errors:
				errorKeys.push( err.list );
				break;

			case errorTypes.error.key_not_found:
				errorKeys.push( wrapInKeyReference( err.params.missingProperty ) );
				errorKeys.push( wrapInQuote( err.data ) );
				break;

			case errorTypes.error.resolved_object_without_z2k2:
				errorKeys.push( wrapInQuote( err.data ) );
				break;

			case errorTypes.error.zobject_must_not_be_number_or_boolean_or_null:
				errorKeys.push( wrapInQuote( err.data ) );
				break;

			case errorTypes.error.missing_type:
				errorKeys.push( wrapInQuote( err.data ) );
				break;

			case errorTypes.error.z1k1_must_not_be_string_or_array:
				errorKeys.push( wrapInQuote( err.data ) );
				break;

			case errorTypes.error.invalid_key:
				errorKeys.push( wrapInZ6( err.params.additionalProperty ) );
				break;

			case errorTypes.error.not_wellformed_value:
				errorKeys.push( wrapInKeyReference( err.key ) );
				errorKeys.push( err.value );
				break;

			case errorTypes.error.z6_without_z6k1:
				errorKeys.push( wrapInQuote( err.data ) );
				break;

			case errorTypes.error.z6k1_must_be_string:
				errorKeys.push( wrapInQuote( err.data ) );
				break;

			case errorTypes.error.z9_without_z9k1:
				errorKeys.push( wrapInQuote( err.data ) );
				break;

			case errorTypes.error.z9k1_must_be_string:
				errorKeys.push( wrapInQuote( err.data ) );
				break;

			default:
				break;
		}

		// Create generic error instance with errorType->error
		const genericError = this.createGenericError( errorType, errorKeys );

		// Create error Z5
		return {
			Z1K1: wrapInZ9( 'Z5' ),
			Z5K1: wrapInZ9( errorType ),
			Z5K2: genericError
		};
	}

}

module.exports = ErrorFormatter;
