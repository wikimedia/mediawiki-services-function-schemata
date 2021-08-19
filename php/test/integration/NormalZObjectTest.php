<?php

namespace Mediawiki\Services\Wikilambda\FunctionSchemata\Tests;

use Mediawiki\Services\Wikilambda\FunctionSchemata\SchemaFactory;
use Mediawiki\Services\Wikilambda\FunctionSchemata\SchemataUtils;

final class NormalZObjectTest extends ValidationTest {
	/**
	 * @coversNothing
	 * @dataProvider provideZIDs
	 */
	public function testNormalizedZObject( $ZID ): void {
		$validator = ( SchemaFactory::getNormalFormFactory() )->create( $ZID );
		$normalFile = SchemataUtils::joinPath(
			SchemataUtils::testDataDirectory(), "normal_zobject", $ZID . ".yaml"
		);
		$testDescriptor = json_decode( SchemataUtils::readYamlAsSecretJson( $normalFile ) );
		$this->testValidation( $validator, $testDescriptor->test_objects );
	}

	public function provideZIDs() {
		// TODO: Enable test for Z7.
		return [
			[ "Z1" ], [ "Z2" ], [ "Z7_backend" ], [ "Z10" ],
			[ "Z14" ], [ "Z17" ], [ "Z18" ], [ "Z22" ], [ "Z39" ], [ "Z40" ],
			[ "Z61" ], [ "Z80" ], [ "Z86" ], [ "Z99" ]
		];
	}
}
