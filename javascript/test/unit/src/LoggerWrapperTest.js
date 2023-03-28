'use strict';

const { LoggerWrapper } = require( '../../../src/LoggerWrapper.js' );

QUnit.module( 'LoggerWrapper' );

class FakeLogger {

	constructor( args = null ) {
		this.level = null;
		this.message = null;
		this.args = args;
	}

	log( level, message ) {
		this.level = level;
		this.message = message;
	}

	child( args ) {
		return new FakeLogger( args );
	}

}

QUnit.test( 'log errors', ( assert ) => {
	const logger = new FakeLogger();
	const wrapper = new LoggerWrapper( logger );
	assert.throws( function () {
		wrapper.log( null, null );
	} );
} );

QUnit.test( 'trace', ( assert ) => {
	const logger = new FakeLogger();
	const wrapper = new LoggerWrapper( logger );
	const msg = 'i will arise and go now';
	wrapper.trace( msg );
	assert.strictEqual( logger.level, 'trace' );
	assert.strictEqual( logger.message, msg );
} );

QUnit.test( 'debug', ( assert ) => {
	const logger = new FakeLogger();
	const wrapper = new LoggerWrapper( logger );
	const msg = 'and go to innisfree';
	wrapper.debug( msg );
	assert.strictEqual( logger.level, 'debug' );
	assert.strictEqual( logger.message, msg );
} );

QUnit.test( 'info', ( assert ) => {
	const logger = new FakeLogger();
	const wrapper = new LoggerWrapper( logger );
	const msg = 'and a small cabin build there';
	wrapper.info( msg );
	assert.strictEqual( logger.level, 'info' );
	assert.strictEqual( logger.message, msg );
} );

QUnit.test( 'warn', ( assert ) => {
	const logger = new FakeLogger();
	const wrapper = new LoggerWrapper( logger );
	const msg = 'of clay and wattles made';
	wrapper.warn( msg );
	assert.strictEqual( logger.level, 'warn' );
	assert.strictEqual( logger.message, msg );
} );

QUnit.test( 'error', ( assert ) => {
	const logger = new FakeLogger();
	const wrapper = new LoggerWrapper( logger );
	const msg = 'nine bean-rows will I have there';
	wrapper.error( msg );
	assert.strictEqual( logger.level, 'error' );
	assert.strictEqual( logger.message, msg );
} );

QUnit.test( 'fatal', ( assert ) => {
	const logger = new FakeLogger();
	const wrapper = new LoggerWrapper( logger );
	const msg = 'a hive for the honey-bee';
	wrapper.fatal( msg );
	assert.strictEqual( logger.level, 'fatal' );
	assert.strictEqual( logger.message, msg );
} );

QUnit.test( 'child', ( assert ) => {
	const logger = new FakeLogger();
	const wrapper = new LoggerWrapper( logger );
	const args = 'and live alone in the bee-loud glade';
	const childWrapper = wrapper.child( args );
	assert.strictEqual( childWrapper._logger.args, args );
} );
