describe('jasmine.jscoverage_reporter.js', function() {
	var original;

	beforeEach(function() {
		expect(jasmine.JSCoverageReporter).toBeDefined();
		original = spyOn(jasmine, 'JSCoverageReporter');
	});
	
	describe('covered version', function() {
		it('installs reporter in jasmine', function() {
			require('../src/jasmine.jscoverage_reporter.js');
			expect(jasmine.JSCoverageReporter).toBeDefined();
			expect(jasmine.JSCoverageReporter).not.toBe(original);
		});
	});
});