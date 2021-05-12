# Shared validation schemata for Wikifunctions

This repository is a shared set of JSON schemata for the Wikifunctions project, to achieve a "single version of the truth" on what counts as a structurally valid ZObject. It is used as a git sub-module for the function-orchestrator and function-evaluator services, and the WikiLambda MediaWiki extension.

We provide programmatic access to the schemata in different languages for different use cases; one in JavaScript for the orchestrator and evaluator, and another in PHP for WikiLambda.

Note: To test the JavaScript code, you need to be in the `javascript/` directory.
