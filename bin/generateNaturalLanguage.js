#!/usr/bin/env node

'use strict';

// # This script generates a new ZNaturalLanguage defintion
// # ./bin/generateNaturalLanguage.js code Autonym EnglishName
// # e.g.:
// # ./bin/generateNaturalLanguage.js en-us "American English" "American English"
// # ./bin/generateNaturalLanguage.js fr-fr "français en France" "French (France)"

const fs = require( 'fs' );
const path = require( 'path' );
const { dataDir } = require( '../javascript/src/fileUtils.js' );

const args = process.argv.slice( 2 );

const dataPath = dataDir( 'definitions' );

const dependenciesFile = fs.readFileSync( path.join( dataPath, 'dependencies.json' ), { encoding: 'utf8' } );
const dependencies = JSON.parse( dependenciesFile );

const languagesFile = fs.readFileSync( path.join( dataPath, 'naturalLanguages.json' ), { encoding: 'utf8' } );
const languages = JSON.parse( languagesFile );

const dataDirectory = fs.readdirSync( dataPath );

if ( args.length !== 3 ) {
	console.error( 'Usage: ./bin/generateNaturalLanguage.js code Autonym EnglishName' );
	throw new Error();
}

const languageToCreate = args[ 0 ];

if ( Object.keys( languages ).includes( languageToCreate ) ) {
	console.error(
		'There is already a natural language for code "' + languageToCreate + '": ' + languages[ languageToCreate ]
	);
	throw new Error();
}

let targetZid;

for ( targetZid = 1011; targetZid < 2000; targetZid++ ) {
	if ( !dataDirectory.includes( 'Z' + targetZid + '.json' ) ) {
		break;
	}
}

if ( targetZid === 2000 ) {
	console.error( 'Couldn\'t find a free ZID between Z1000 and Z2000!' );
	throw new Error();
}

targetZid = 'Z' + targetZid;

const languageObject = {
	Z1K1: 'Z2',
	Z2K1: {
		Z1K1: 'Z6',
		Z6K1: targetZid
	},
	Z2K2: {
		Z1K1: 'Z60',
		Z60K1: languageToCreate
	},
	Z2K3: {
		Z1K1: 'Z12',
		Z12K1: [
			'Z11',
			{
				Z1K1: 'Z11',
				Z11K1: 'Z1002',
				Z11K2: args[ 2 ]
			},
			{
				Z1K1: 'Z11',
				Z11K1: targetZid,
				Z11K2: args[ 1 ]
			}
		]
	}
};

const languageObjectString = JSON.stringify( languageObject, null, '\t' ) + '\n';
fs.writeFileSync( path.join( dataPath, targetZid + '.json' ), languageObjectString );

languages[ languageToCreate ] = targetZid;
let newLanguagesOrder = Object.keys( languages ).sort(
	( a, b ) => {
		return a.localeCompare(
			b,
			'en', { numeric: true }
		);
	}
);
// Special order for language lists
const specialLanguages = [ 'ar', 'en', 'es', 'fr', 'ru', 'zh' ];
newLanguagesOrder = specialLanguages.concat( newLanguagesOrder );
const languagesObjectString = JSON.stringify( languages, newLanguagesOrder, '\t' ) + '\n';
fs.writeFileSync( path.join( dataPath, 'naturalLanguages.json' ), languagesObjectString );

dependencies[ targetZid ] = [ 'Z60', 'Z1002' ];
// Less special order for dependencies lists
const newDependenciesOrder = Object.keys( dependencies ).sort(
	( a, b ) => {
		return a.localeCompare(
			b,
			'en', { numeric: true }
		);
	}
);
const dependenciesObjectString = JSON.stringify( dependencies, newDependenciesOrder, '\t' ) + '\n';
fs.writeFileSync( path.join( dataPath, 'dependencies.json' ), dependenciesObjectString );

console.log( 'definitions: Add ' + targetZid + '/' + languageToCreate + ' ZNaturalLanguage' );
