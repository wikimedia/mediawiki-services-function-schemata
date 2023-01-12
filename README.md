# Shared validation schemata for Wikifunctions

This repository is a shared set of JSON schemata for the Wikifunctions project, to achieve a "single version of the truth" on what counts as a structurally valid ZObject. It is used as a git sub-module for the function-orchestrator and function-evaluator services, and the WikiLambda MediaWiki extension.

We provide programmatic access to the schemata in different languages for different use cases; one in JavaScript for the orchestrator and evaluator, and another in PHP for WikiLambda.

Note: To test the JavaScript code, you need to be in the `javascript/` directory.

## Pre-defined ZObject definitions

A number of ZObjects are pre-defined for the Wikifunctions system, and used by the WikiLambda MediaWiki extension as well as the function-orchestrator (and through that, the function-evaluator).

The ranges of which ZIDs can be used for which types are documented [on Meta](https://meta.wikimedia.org/wiki/Abstract_Wikipedia/Reserved_ZIDs), though this will move to wikifunctions.org when that site goes live.

When updating the definitions, you must manually update the `dependencies.json` file (running the tests will inform you of the missing items).

When updating the natural language definitions, you must also update the `naturalLanguages.json` file.

When updating the software language definitions, you must also update the `softwareLanguages.json` file.

You can spot gaps in the generated definitions with a simple script, //e.g.// in node: `const definitions = fs.readdirSync('./data/definitions'); for ( let i = 1001; i <= 1880; i++ ) {if ( !definitions.includes('Z' + i + '.json' ) ) { console.log( 'Unused ZNaturalLanguage ZID: Z' + i ); } };`.
