describe('jasmine.jscoverage_reporter.js', function() {
	var fs = require('fs');

	// This will replace the jasmine.JSCoverageReporter instance
	// with the JSCoverage augmented one
	var original = jasmine.JSCoverageReporter;
	require('../src/jasmine.jscoverage_reporter.js');
	
	it('installs reporter in jasmine', function() {
		expect(jasmine.JSCoverageReporter).toBeDefined();
		expect(jasmine.JSCoverageReporter).not.toBe(original);
	});

	it('saves two files', function() {
		var reporter = new jasmine.JSCoverageReporter('.');
		spyOn(fs, 'openSync');
		spyOn(fs, 'writeSync');
		spyOn(fs, 'closeSync');
		reporter.reportRunnerResults();
		expect(fs.openSync.callCount).toBe(2);
		expect(fs.openSync.argsForCall[0][0]).toBe('./coverage.xml');
		expect(fs.openSync.argsForCall[1][0]).toBe('./jscoverage.json');
	});
});