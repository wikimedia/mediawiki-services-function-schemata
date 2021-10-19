<?php

namespace Mediawiki\Services\Wikilambda\FunctionSchemata\Tests;

use Mediawiki\Services\Wikilambda\FunctionSchemata\SchemaWrapper;
use PHPUnit\Framework\TestCase;

/**
 * Defines the testValidation helper function to facilitate working with test
 * cases define in JSON objects.
 */
abstract class ValidationTest extends TestCase {
	/**
	 * Helper function to test success and failure on the validation
	 * of ZObjects.
	 *
	 * @param SchemaWrapper $validator
	 * @param mixed $testObjects
	 */
	protected function testValidation( SchemaWrapper $validator, $testObjects ): void {
		$successes = [];
		if ( isset( $testObjects->success ) ) {
			$successes = $testObjects->success;
		}

		foreach ( $successes as $testObject ) {
			$status = $validator->validate( $testObject->object );
			$message = $testObject->name;
			if ( !$status->isValid() ) {
				$message .= var_export( $validator->errors, true );
			}
			$this->assertTrue( $status->isValid(), $message );
		}

		$failures = [];
		if ( isset( $testObjects->failure ) ) {
			$failures = $testObjects->failure;
		}

		foreach ( $failures as $testObject ) {
			$status = $validator->validate( $testObject->object );
			$this->assertFalse(
				$status->isValid(),
				$testObject->name );
		}
	}
}
