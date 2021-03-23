<?php

namespace Mediawiki\Services\Wikilambda\FunctionSchemata\Tests;

use Mediawiki\Services\Wikilambda\FunctionSchemata\ISchema;
use Mediawiki\Services\Wikilambda\FunctionSchemata\SchemaFactory;
use Mediawiki\Services\Wikilambda\FunctionSchemata\SchemataUtils;
use Mediawiki\Services\Wikilambda\FunctionSchemata\YumYumYamlLoader;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Yaml\Yaml;

final class SchemaFactoryTest extends TestCase {
	public function testNormal(): void {
		$mockLoader = $this->createMock( YumYumYamlLoader::class );
		$mockLoader->expects( $this->once() )->method( 'registerPath' )->with(
			$this->equalTo( SchemataUtils::joinPath( SchemataUtils::dataDirectory(), "NORMAL" ) ),
			$this->equalTo( "NORMAL" )
		);
		$factory = SchemaFactory::NORMAL( $mockLoader );
		$schema = $factory->create( "Z10" );
		$this->assertInstanceOf( ISchema::class, $schema );
	}

	public function testStandAlone(): void {
		$factory = SchemaFactory::STANDALONE();
		$yamlContents = "type: string";
		/*
		$yamlContents = <<<EOYAML
			type: string
		EOYAML;
		*/
		$schema = $factory->parse( Yaml::parse( $yamlContents ) );
		$this->assertInstanceOf( ISchema::class, $schema );
	}
}
