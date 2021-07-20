<?php

namespace Mediawiki\Services\Wikilambda\FunctionSchemata\Tests;

use Mediawiki\Services\Wikilambda\FunctionSchemata\ISchema;
use PHPUnit\Framework\TestCase;

/**
 * Defines the testValidation helper function to facilitate working with test
 * cases define in JSON objects.
 */
abstract class ValidationTest extends TestCase {
	/**
	 * @param ISchema $validator
	 * @param mixed $testObjects
	 */
	protected function testValidation( ISchema $validator, $testObjects ): void {
		$successes = [];
		if ( isset( $testObjects->success ) ) {
			$successes = $testObjects->success;
		}

		foreach ( $successes as $testObject ) {
			$this->assertTrue( $validator->validate( $testObject->object ) );
		}

		$failures = [];
		if ( isset( $testObjects->failure ) ) {
			$failures = $testObjects->failure;
		}

		foreach ( $failures as $testObject ) {
			$this->assertFalse( $validator->validate( $testObject->object ) );
		}
	}
}
