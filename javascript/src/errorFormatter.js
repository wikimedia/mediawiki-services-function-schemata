'use strict';

const { readYaml, dataDir } = require( './utils.js' );

class ErrorFormatter {

	// FIXME: This is a syntax error (and isn't necessary?)
	// static _errorDescriptors = null;

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
			// FIXME: We don't have ES2020 available
			// eslint-disable-next-line no-restricted-properties
			const path = [ ...parserError.instancePath.matchAll( /\bZ\d+K\d+\b/g ) ].map( ( m ) => m[ 0 ] );

			// no path means it's a root error
			if ( path.length === 0 ) {
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
		return {
			Z1K1: 'Z5',
			Z5K1: 'Z526',
			Z5K2: {
				Z1K1: 'Z526',
				Z526K1: {
					Z1K1: 'Z39',
					Z39K1: key
				},
				Z526K2: Z5
			}
		};
	}

	/**
	 * Create a ZError (Z5) of the type "Not wellformed" (Z502)
	 *
	 * @param {Object} Z5
	 * @return {Object}
	 */
	static createValidationZError( Z5 ) {
		return {
			Z1K1: 'Z5',
			Z5K1: 'Z502',
			Z5K2: {
				Z1K1: 'Z502',
				Z502K1: Z5.Z5K1,
				Z502K2: Z5
			}
		};
	}

	/**
	 * Create a ZError (Z5) of the type "Multiple errors" (Z509)
	 *
	 * @param {*} array
	 * @return {Object|null}
	 */
	static createZErrorList( array ) {
		return {
			Z1K1: 'Z5',
			Z5K1: 'Z509',
			Z5K2: array
		};
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

			return descriptor.keywordArgs.used.indexOf( expandedType ) > -1;
		}

		return descriptor.keywordArgs.expected === err.params.type;
	}

	/**
	 * Create a ZError (Z5) of a given ZErrorType
	 *
	 * @param {string} errorType
	 * @param {Object} err
	 * @return {Object}
	 */
	static createZErrorInstance( errorType, err ) {
		let Z5K2;

		switch ( errorType ) {
			case 'Z511':
				Z5K2 = {
					Z1K1: 'Z511',
					Z511K1: {
						Z1K1: 'Z39',
						Z39K1: err.params.missingProperty
					},
					Z511K2: {
						Z1K1: 'Z99',
						Z99K1: err.data
					}
				};
				break;

			case 'Z524':
				Z5K2 = {
					Z1K1: 'Z524',
					Z524K1: err.data
				};
				break;

			case 'Z525':
				Z5K2 = {
					Z1K1: 'Z525',
					Z525K1: {
						Z1K1: 'Z6',
						// TODO: check invalid properties to build Z6k1
						Z6K1: 'todo'
					}
				};
				break;

			default: Z5K2 = this.createErrorQuote( errorType, err );
		}

		return {
			Z1K1: 'Z5',
			Z5K1: errorType,
			Z5K2: Z5K2
		};
	}

	/**
	 * Creates a generic quote/Z99 for a given error type and an Ajv error object
	 *
	 * @param {string} zid
	 * @param {Object} err
	 * @return {Object}
	 */
	static createErrorQuote( zid, err ) {
		return {
			Z1K1: zid,
			[ zid + 'K1' ]: {
				Z1K1: 'Z99',
				Z99K1: err.data
			}
		};
	}

}

module.exports = ErrorFormatter;
