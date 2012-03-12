var wrench = require('wrench');
var exec = require('child_process').exec;

var run = function() {
  wrench.mkdirSyncRecursive('build/test');
  wrench.copyDirSyncRecursive('test', 'build/test');

  wrench.rmdirSyncRecursive('reports');
  wrench.mkdirSyncRecursive('reports/coverage');
  wrench.copyDirSyncRecursive('css/', 'reports/coverage/');

  require('./node_modules/jasmine-node/lib/jasmine-node/index.js');
  require('./test/jasmine.jscoverage_reporter');
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.addReporter(new jasmine.JSCoverageReporter('./reports'));
  require('./node_modules/jasmine-node/lib/jasmine-node/cli.js');
};

wrench.rmdirSyncRecursive('build');
wrench.mkdirSyncRecursive('build/src');
exec('jscoverage src build/src',
  function (error, stdout, stderr) {
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    if (error) {
      console.error('exec error', error);
      process.exit(1);
    }
    run();
});
