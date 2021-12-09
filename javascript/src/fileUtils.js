'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const yaml = require( 'yaml' );

function readYaml( fileName ) {
	const text = fs.readFileSync( fileName, { encoding: 'utf8' } );
	return yaml.parse( text );
}

function dataDir( ...pathComponents ) {
	return path.join(
		path.dirname( path.dirname( path.dirname( __filename ) ) ),
		'data', ...pathComponents );
}

module.exports = {
	dataDir,
	readYaml
};
