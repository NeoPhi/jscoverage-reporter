// A comment
module.exports = {
	development: {},
	alpha: {},
	test: {}
};
module.exports.test = function(a, b) {
	if (a || b) {
		return 1;
	}
};

// Another comment
var f = function(a) {
	// Comment
	return a + 2;
};