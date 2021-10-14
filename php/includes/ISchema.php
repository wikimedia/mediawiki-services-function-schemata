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
use Opis\JsonSchema\ValidationResult;
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
	 * @param Schema $schema
	 * @param Validator $validator
	 */
	public function __construct( Schema $schema, Validator $validator ) {
		$this->schema = $schema;
		$this->validator = $validator;
	}

	/**
	 * @param mixed $maybeValid JSON array-like object to validate
	 * @param int $maxErrors
	 * @return ValidationResult
	 */
	public function validate( $maybeValid, $maxErrors = 1 ): ValidationResult {
		return $this->validator->schemaValidation(
			$maybeValid,
			$this->schema,
			$maxErrors
		);
	}
}
