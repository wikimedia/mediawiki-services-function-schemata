<?php

namespace Mediawiki\Services\Wikilambda\FunctionSchemata\Tests;

use Mediawiki\Services\Wikilambda\FunctionSchemata\SchemaFactory;
use Mediawiki\Services\Wikilambda\FunctionSchemata\SchemataUtils;

final class NormalZObjectTest extends ValidationTest {
	/**
	 * @dataProvider provideZIDs
	 */
	public function testNormalizedZObject( $ZID ): void {
		$validator = ( SchemaFactory::NORMAL() )->create( $ZID );
		$normalFile = SchemataUtils::joinPath(
			SchemataUtils::testDataDirectory(), "normal_zobject", $ZID . ".yaml"
		);
		$testDescriptor = json_decode( SchemataUtils::readYamlAsSecretJson( $normalFile ) );
		$this->testValidation( $validator, $testDescriptor->test_objects );
	}

	public function provideZIDs() {
		return [
			[ "Z1" ], [ "Z2" ], [ "Z10" ], [ "Z22" ], [ "Z39" ], [ "Z40" ], [ "Z86" ]
		];
	}
}
