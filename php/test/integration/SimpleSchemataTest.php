<?php

namespace Mediawiki\Services\Wikilambda\FunctionSchemata\Tests;

use Mediawiki\Services\Wikilambda\FunctionSchemata\ISchema;
use Mediawiki\Services\Wikilambda\FunctionSchemata\SchemaFactory;
use Mediawiki\Services\Wikilambda\FunctionSchemata\SchemataUtils;

final class SimpleSchemataTest extends ValidationTest {

	/**
	 * @dataProvider provideValidSchemata
	 */
	public function testSimpleSchemata( ISchema $validator, $testObjects ): void {
		$this->testValidation( $validator, $testObjects );
	}

	public function provideValidSchemata() {
		$directoryGlob = SchemataUtils::joinPath( SchemataUtils::testDataDirectory(), "simple_schemata", "*" );
		$fileNames = glob( $directoryGlob );
		$factory = SchemaFactory::STANDALONE();
		foreach ( $fileNames as $fileName ) {
			$testDescriptor = json_decode( SchemataUtils::readYamlAsSecretJson( $fileName ) );
			$validator = $factory->parse( $testDescriptor->test_schema->validator );
			if ( !$testDescriptor->test_information->parse_error ) {
				yield [ $validator, $testDescriptor->test_objects ];
			}
		}
	}

	/**
	 * @dataProvider provideParseFailures
	 */
	public function DISABLED_testParseFailures( $validator ): void {
		// $this->assertIsNull($validator);
	}

	public function provideParseFailures() {
		$directoryGlob = SchemataUtils::joinPath( SchemataUtils::testDataDirectory(), "simple_schemata", "*" );
		$fileNames = glob( $directoryGlob );
		$factory = SchemaFactory::STANDALONE();
		foreach ( $fileNames as $fileName ) {
			$testDescriptor = json_decode( SchemataUtils::readYamlAsSecretJson( $fileName ) );
			$validator = $factory->parse( $testDescriptor->test_schema->validator );
			if ( $testDescriptor->test_information->parse_error ) {
				yield [ $validator ];
			}
		}
	}
}
