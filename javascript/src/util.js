'use strict';

const fs = require('fs');
const YAML = require('yaml');

function readYaml(fileName) {
	const text = fs.readFileSync(fileName, { encoding: 'utf8' });
	return YAML.parse(text);
}

module.exports = { readYaml };
