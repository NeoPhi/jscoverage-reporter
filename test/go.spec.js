describe('files', function() {
	it('does stuff', function() {
		var config = require('../src/config');
		var constants = require('../src/constants');
		expect(config.development).toBeDefined();
		expect(constants.A).toBe('a');
	});
});