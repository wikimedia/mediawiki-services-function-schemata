<?php
/**
 * WikiLambda SchemaFactory class for generating Open API validators
 *
 * @file
 * @copyright 2020–2021 WikiLambda team
 * @license MIT
 */

namespace Mediawiki\Services\Wikilambda\FunctionSchemata;

use Opis\JsonSchema\Schema;

class SchemaFactory {
	/**
	 * @var ISchemaLoader
	 */
	private $loader;

	/**
	 * @param string|null $loader Which loader to use
	 */
	private function __construct( $loader = null ) {
		$this->loader = $loader;
	}

	/**
	 * Creates a SchemaFactory for normal-form ZObjects.
	 *
	 * @param string|null $loader Which loader to use
	 * @return SchemaFactory
	 */
	public static function getNormalFormFactory( $loader = null ): SchemaFactory {
		if ( $loader == null ) {
			$loader = new YumYumYamlLoader();
		}
		$normalDirectory = SchemataUtils::joinPath( SchemataUtils::dataDirectory(), 'NORMAL' );
		$loader->registerPath( $normalDirectory, 'NORMAL' );
		return new SchemaFactory( $loader );
	}

	/**
	 * Creates a SchemaFactory for parsing standalone schemata (no external refs).
	 *
	 * @return SchemaFactory
	 */
	public static function getStandAloneFactory(): SchemaFactory {
		return new SchemaFactory();
	}

	/**
	 * @param mixed $schemaSpec
	 * @return ISchema
	 */
	public function parse( $schemaSpec ) {
		$validator = new \Opis\JsonSchema\Validator();
		$jsonEncoded = json_encode( $schemaSpec );
		$schema = Schema::fromJsonString( $jsonEncoded );
		return new ISchema( $schema, $validator );
	}

	/**
	 * Creates an ISchema that validates the normalized form of the provided
	 * type.
	 * TODO: Assert that this->loader is not null.
	 *
	 * @param string $ZID
	 * @return ISchema
	 */
	public function create( $ZID ): ISchema {
		if ( $ZID == "Z13" ) {
			$ZID = "Z10";
		} elseif ( $ZID == "Z41" || $ZID == "Z42" ) {
			$ZID = "Z10";
		}
		$schema = $this->loader->loadSchema( $ZID );
		$validator = new \Opis\JsonSchema\Validator();
		$validator->setLoader( $this->loader );
		return new ISchema( $schema, $validator );
	}
}
