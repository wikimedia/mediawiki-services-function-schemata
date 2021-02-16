'use strict';

const Ajv = require('ajv').default;

function Schema(validate) {
	this.validate_ = validate;
}

Schema.parse = function (schema) {
	const ajv = new Ajv();
	try {
		const validate = ajv.compile(schema);
		return new Schema(validate);
	} catch (err) {
		console.log(err.message);
		return null;
	}
};

Schema.prototype.validate = function (maybeValid) {
	return this.validate_(maybeValid);
};

module.exports = { Schema };
