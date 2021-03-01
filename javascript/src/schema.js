'use strict';

const Ajv = require('ajv').default;
const { readYaml } = require('./util.js');

const supportedSchemata = {
    FUNCTION_CALL: '../data/function_call.yaml',
    NORMAL: '../data/normal_zobject.yaml',
    CANONICAL: '../data/canonical_zobject.yaml'
};

function Schema(validate) {
	this.validate_ = validate;
    this.errors = [];
}

Schema.parse = function (schema) {
	const ajv = new Ajv({ allowMatchingProperties: true });
	try {
		const validate = ajv.compile(schema);
		return new Schema(validate);
	} catch (err) {
        console.log('Could not parse schema:');
		console.log(err.message);
		return null;
	}
};

Schema.for = function (schemaName) {
    const fname = supportedSchemata[schemaName];
    if (fname === undefined) {
        console.log('no schema for ' + schemaName);
        return null;
    }
    return Schema.parse(readYaml(fname));
};

Schema.prototype.validate = function (maybeValid) {
    const result = this.validate_(maybeValid);
    if (result) {
        this.errors = [];
        return true;
    }
    this.errors = this.validate_.errors;
    return false;
};

module.exports = { Schema, supportedSchemata };
