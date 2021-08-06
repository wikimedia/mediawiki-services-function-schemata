const ErrorFormater = require('./errorFormatter');

class ValidationStatus {

	constructor(validator, result) {
		this._isValid = Boolean(result);

		if (!this._isValid) {
			this.parserErrors = validator.errors;
			this.Z5 = ErrorFormater.createRootZError(this.parserErrors);
		} else {
			this.parserErrors = [];
			this.Z5 = null;
		}
	}

	isValid() {
		return this._isValid;
	}

	getParserErrors() {
		return this.parserErrors;
	}

	getZ5() {
		return this.Z5;
	}

	toString() {
		return JSON.stringify({
			isValid: this._isValid,
			zError: this.Z5,
		})
	}

}

module.exports = { ValidationStatus }
