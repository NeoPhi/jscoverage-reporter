(function() {
  if (!jasmine) {
    throw new Exception("jasmine library does not exist in global namespace!");
  }

  // When running in node setup the global variable JSCoverage looks for
  if (!global.top) {
    global.top = {};
  }

  var writeFile = function(filename, text) {
    // Rhino
    try {
      var out = new java.io.BufferedWriter(new java.io.FileWriter(filename));
      out.write(text);
      out.close();
      return;
    } catch (e) {
    }
    // PhantomJS, via pyphantomjs and the saveToFile plugin
    // http://dev.umaclan.com/projects/pyphantomjs/wiki/Plugins#Save-to-File
    try {
      phantom.saveToFile(text, filename);
      return;
    } catch (f) {
    }
    // Node
    try {
      var fs = require("fs");
      var fd = fs.openSync(filename, "w");
      fs.writeSync(fd, text, 0);
      fs.closeSync(fd);
      return;
    } catch (g) {
    }
  };
  
  var calculateCoverage = function(stats, metric) {
    var covered = stats[metric + 'Covered'];
    var total = stats[metric + 'Total'];
    var coverage = Math.round(covered / total * 100);
    return coverage + '% (' + covered + '/' + total + ')';
  };

  var calculateStats = function(coverage) {
    var stats = {
      packagesCovered : 1,
      packagesTotal : 1,
      classesCovered : 0,
      classesTotal : 0,
      methodsCovered : 1,
      methodsTotal : 1,
      srcfilesCovered : 0,
      srcfilesTotal : 0,
      srclinesCovered : 0,
      srclinesTotal : 0
    };
    for (var file in coverage) {
      if (coverage.hasOwnProperty(file)) {
        stats.classesCovered += 1;
        stats.classesTotal += 1;
        stats.srcfilesCovered += 1;
        stats.srcfilesTotal += 1;
        var srclinesTotal = 0;
        var srclinesCovered = 0;
        for (var i = 0; i < coverage[file].source.length; i += 1) {
          if (coverage[file][i + 1] !== void 0) {
            srclinesTotal += 1;
            if (coverage[file][i + 1] > 0) {
              srclinesCovered += 1;
            }
          }
        }
        stats.srclinesTotal += srclinesTotal;
        stats.srclinesCovered += srclinesCovered;
      }
    }
    return stats;
  };

  var writeEmmaReport = function(savePath, coverage) {
    var stats = calculateStats(coverage);
    var xml = [];
    xml.push('<report>');
    xml.push('  <stats>');
    xml.push('    <packages value="' + stats.packagesTotal + '"/>');
    xml.push('    <classes value="' + stats.classesTotal + '"/>');
    xml.push('    <methods value="' + stats.methodsTotal + '"/>');
    xml.push('    <srcfiles value="' + stats.srcfilesTotal + '"/>');
    xml.push('    <srclines value="' + stats.srclinesTotal + '"/>');
    xml.push('  </stats>');
    xml.push('  <data>');
    xml.push('    <all name="all classes">');
    xml.push('      <coverage type="class, %" value="' + calculateCoverage(stats, 'classes') + '"/>');
    xml.push('      <coverage type="method, %" value="' + calculateCoverage(stats, 'methods') + '"/>');
    xml.push('      <coverage type="block, %" value="' + calculateCoverage(stats, 'methods') + '"/>');
    xml.push('      <coverage type="line, %" value="' + calculateCoverage(stats, 'srclines') + '"/>');
    xml.push('    </all>');
    xml.push('  </data>');
    xml.push('</report>');
    writeFile(savePath + '/emmaCoverage.xml', xml.join('\n'));
  };

  var writeCoverageData = function(savePath, coverage) {
    var source = {};
    for (var file in coverage) {
      if (coverage.hasOwnProperty(file)) {
        source[file] = coverage[file].source;
      }
    }
    var js = [];
    js.push('(function() {');
    js.push('  try {');
    js.push('    if (typeof top === \'object\' && top !== null && typeof top.opener === \'object\' && top.opener !== null) {');
    js.push('      // this is a browser window that was opened from another window');
    js.push('  ');
    js.push('      if (! top.opener._$jscoverage) {');
    js.push('        top.opener._$jscoverage = {};');
    js.push('      }');
    js.push('    }');
    js.push('  }');
    js.push('  catch (e) {}');
    js.push('  ');
    js.push('  try {');
    js.push('    if (typeof top === \'object\' && top !== null) {');
    js.push('      // this is a browser window');
    js.push('  ');
    js.push('      try {');
    js.push('        if (typeof top.opener === \'object\' && top.opener !== null && top.opener._$jscoverage) {');
    js.push('          top._$jscoverage = top.opener._$jscoverage;');
    js.push('        }');
    js.push('      }');
    js.push('      catch (e) {}');
    js.push('  ');
    js.push('      if (! top._$jscoverage) {');
    js.push('        top._$jscoverage = {};');
    js.push('      }');
    js.push('    }');
    js.push('  }');
    js.push('  catch (e) {}');
    js.push('  ');
    js.push('  try {');
    js.push('    if (typeof top === \'object\' && top !== null && top._$jscoverage) {');
    js.push('      _$jscoverage = top._$jscoverage;');
    js.push('    }');
    js.push('  }');
    js.push('  catch (e) {}');
    js.push('  if (typeof _$jscoverage !== \'object\') {');
    js.push('    _$jscoverage = {};');
    js.push('  }');
    js.push('  var lines = ' + JSON.stringify(coverage) + ';');
    js.push('  var source = ' + JSON.stringify(source) + ';');
    js.push('  for (var file in lines) {');
    js.push('    _$jscoverage[file] = lines[file];');
    js.push('    _$jscoverage[file].source = source[file];');
    js.push('  }');
    js.push('}());');
    writeFile(savePath + '/coverageData.js', js.join('\n'));
  };

  var JSCoverageReporter = function(savePath) {
    this.savePath = savePath || '';
  };

  JSCoverageReporter.prototype = {
    reportSpecStarting : function(spec) {
    },

    reportSpecResults : function(spec) {
    },

    reportSuiteResults : function(suite) {
    },

    reportRunnerResults : function(runner) {
      var coverage = global.top._$jscoverage;
      writeEmmaReport(this.savePath, coverage);
      writeCoverageData(this.savePath, coverage);
    },

    log : function(str) {
      var console = jasmine.getGlobal().console;

      if (console && console.log) {
        console.log(str);
      }
    }
  };

  // export public
  jasmine.JSCoverageReporter = JSCoverageReporter;
}());
