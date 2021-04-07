<?php
/**
 * @file
 * @copyright 2020–2021 WikiLambda team
 * @license MIT
 */

namespace Mediawiki\Services\Wikilambda\FunctionSchemata;

use Symfony\Component\Yaml\Yaml;

class SchemataUtils {

	/**
	 * Joins an arbitrary number of path components via DIRECTORY_SEPARATOR.
	 * @return string
	 */
	public static function joinPath() : string {
		$components = [];
		foreach ( func_get_args() as $component ) {
			$component = rtrim( $component, DIRECTORY_SEPARATOR );
			array_push( $components, $component );
		}
		return implode( DIRECTORY_SEPARATOR, $components );
	}

	/**
	 * @return string
	 */
	public static function dataDirectory() : string {
		return self::joinPath( __DIR__, "..", "..", "data" );
	}

	/**
	 * @return string
	 */
	public static function testDataDirectory() : string {
		return self::joinPath( __DIR__, "..", "..", "test_data" );
	}

	/**
	 * @param string $yamlFile File to read
	 * @return string
	 */
	public static function readYaml( string $yamlFile ) {
		return Yaml::parseFile( $yamlFile );
	}

	/**
	 * @param string $yamlFile File to read
	 * @return string
	 */
	public static function readYamlAsSecretJson( string $yamlFile ) {
		return json_encode( self::readYaml( $yamlFile ) );
	}

}
