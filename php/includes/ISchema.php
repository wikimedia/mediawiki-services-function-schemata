<?php
/**
 * WikiLambda interface for schema validator
 *
 * @file
 * @copyright 2020–2021 WikiLambda team
 * @license MIT
 */

namespace Mediawiki\Services\Wikilambda\FunctionSchemata;

use Opis\JsonSchema\Schema;
use Opis\JsonSchema\ValidationError;
use Opis\JsonSchema\Validator;

class ISchema {
	/**
	 * @var Schema
	 */
	private $schema;

	/**
	 * @var Validator
	 */
	private $validator;

	/**
	 * @var ValidationError[]
	 */
	public $errors;

	/**
	 * @param Schema $schema
	 * @param Validator $validator
	 */
	public function __construct( Schema $schema, Validator $validator ) {
		$this->schema = $schema;
		$this->validator = $validator;
		$this->errors = [];
	}

	/**
	 * @param mixed $maybeValid JSON array-like object to validate
	 * @return bool
	 */
	public function validate( $maybeValid ): bool {
		$result = $this->validator->schemaValidation( $maybeValid, $this->schema );
		if ( $result->isValid() ) {
			$this->errors = [];
			return true;
		}
		$this->errors = $result->getErrors();
		return false;
	}
}
