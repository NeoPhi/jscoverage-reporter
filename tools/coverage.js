var wrench = require('wrench');
var exec = require('child_process').exec;

var run = function() {
  wrench.mkdirSyncRecursive('build/test');
  wrench.copyDirSyncRecursive('test', 'build/test');

  wrench.rmdirSyncRecursive('reports', true);
  wrench.mkdirSyncRecursive('reports/coverage');
  wrench.copyDirSyncRecursive('template/', 'reports/');

  require('../node_modules/jasmine-node/lib/jasmine-node/index.js');
  require('../src/jasmine.jscoverage_reporter');
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.addReporter(new jasmine.JSCoverageReporter('./reports'));
  require('../node_modules/jasmine-node/lib/jasmine-node/cli.js');
};

wrench.rmdirSyncRecursive('build', true);
wrench.mkdirSyncRecursive('build/src');
exec('jscoverage src build/src', function(err, stdout, stderr) {
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.error(stderr);
  }
  if (err) {
    console.error('exec error', err);
    process.exit(1);
  }
  run();
});