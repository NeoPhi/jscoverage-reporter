(function() {
  if (!jasmine) {
    throw new Exception('jasmine library does not exist in global namespace!');
  }

  // When running in node setup the global variable JSCoverage looks for
  try {
    if (global && !global.top) {
      global.top = {};
    }
  } catch(e) {}

  // writeFile from: https://github.com/larrymyers/jasmine-reporters
  var writeFile = function(filename, text) {
    // Rhino
    try {
      var out = new java.io.BufferedWriter(new java.io.FileWriter(filename));
      out.write(text);
      out.close();
      return;
    } catch (e) {}
    // PhantomJS, via a method injected by phantomjs-testrunner.js
    try {
      __phantom_writeFile(filename, text);
      return;
    } catch (f) {}
    // Node.js
    try {
      var fs = require('fs');
      var fd = fs.openSync(filename, 'w');
      fs.writeSync(fd, text, 0);
      fs.closeSync(fd);
      return;
    } catch (g) {}
  };
  
  var calculateCoverage = function(stats, metric) {
    var covered = stats[metric + 'Covered'];
    var total = stats[metric + 'Total'];
    var coverage = Math.round(covered / total * 100);
    return coverage + '% (' + covered + '/' + total + ')';
  };

  var calculateStats = function(coverage) {
    var stats = {
      packagesCovered: 1,
      packagesTotal: 1,
      classesCovered: 0,
      classesTotal: 0,
      methodsCovered: 1,
      methodsTotal: 1,
      srcfilesCovered: 0,
      srcfilesTotal: 0,
      srclinesCovered: 0,
      srclinesTotal: 0
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
    writeFile(savePath + '/coverage.xml', xml.join('\n'));
  };

  // jscoverage_pad from: http://siliconforks.com/jscoverage/
  var jscoverage_pad = function(s) {
    return '0000'.substr(s.length) + s;
  };

  // jscoverage_quote from: http://siliconforks.com/jscoverage/
  var jscoverage_quote = function(s) {
    return '"' + s.replace(/[\u0000-\u001f"\\\u007f-\uffff]/g, function (c) {
      switch (c) {
      case '\b':
        return '\\b';
      case '\f':
        return '\\f';
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '\t':
        return '\\t';
      // IE doesn't support this
      /*
      case '\v':
        return '\\v';
      */
      case '"':
        return '\\"';
      case '\\':
        return '\\\\';
      default:
        return '\\u' + jscoverage_pad(c.charCodeAt(0).toString(16));
      }
    }) + '"';
  };

  // jscoverage_serializeCoverageToJSON from: http://siliconforks.com/jscoverage/
  var jscoverage_serializeCoverageToJSON = function(_$jscoverage) {
    var json = [];
    for (var file in _$jscoverage) {
      if (! _$jscoverage.hasOwnProperty(file)) {
        continue;
      }

      var coverage = _$jscoverage[file];

      var array = [];
      var line;
      var length = coverage.length;
      for (line = 0; line < length; line += 1) {
        var value = coverage[line];
        if (value === undefined || value === null) {
          value = 'null';
        }
        array.push(value);
      }

      var source = coverage.source;
      var lines = [];
      length = source.length;
      for (line = 0; line < length; line += 1) {
        lines.push(jscoverage_quote(source[line]));
      }

      json.push(jscoverage_quote(file) + ':{"coverage":[' + array.join(',') + '],"source":[' + lines.join(',') + ']}');
    }
    return '{' + json.join(',') + '}';
  };

  var writeCoverageData = function(savePath, coverage) {
    writeFile(savePath + '/jscoverage.json', jscoverage_serializeCoverageToJSON(coverage));
  };

  var getCoverage = function() {
    try {
      return top._$jscoverage;
    } catch(e) {}
    return {};
  };

  var JSCoverageReporter = function(savePath) {
    this.savePath = savePath || '';
  };

  JSCoverageReporter.prototype = {
    reportSpecStarting: function(spec) {
    },

    reportSpecResults: function(spec) {
    },

    reportSuiteResults: function(suite) {
    },

    reportRunnerResults: function(runner) {
      var coverage = getCoverage();
      writeEmmaReport(this.savePath, coverage);
      writeCoverageData(this.savePath, coverage);
    },

    log: function(str) {
      var console = jasmine.getGlobal().console;

      if (console && console.log) {
        console.log(str);
      }
    }
  };

  jasmine.JSCoverageReporter = JSCoverageReporter;
}());
