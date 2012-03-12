(function() {
  if (!jasmine) {
    throw new Exception("jasmine library does not exist in global namespace!");
  }

  if (!global.top) {
    global.top = {};
  }

  function escapeInvalidXmlChars(str) {
    return str.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/\>/g, "&gt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
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
  
  var renderCoverage = function(covered, total) {
    var coverage = Math.round(covered / total * 100);
    var html = '';
    html += '<td class="coverage">';
    html += '  <div class="pctGraph">';
    html += '    <div class="covered" style="width: ' + coverage + 'px;"></div>';
    html += '  </div>'
    html += '  <span class="pct">' + coverage + '%</span>';
    html += '</td>';
    return html;
  };

  var renderStyle = function() {
    var html = '';
    html += '    <link rel="stylesheet" type="text/css" href="jscoverage-highlight.css"/>\n';
    html += '    <link rel="stylesheet" type="text/css" href="jscoverage.css"/>\n';
    html += '    <!--[if IE]>\n';
    html += '    <link rel="stylesheet" type="text/css" href="jscoverage-ie.css">\n';
    html += '    <![endif]-->\n';
    return html;
  };

  var calculateCoverage = function(stats, metric) {
    var covered = stats[metric + 'Covered'];
    var total = stats[metric + 'Total'];
    var coverage = Math.round(covered / total * 100);
    return coverage + '% (' + covered + '/' + total + ')';
  };

  var reportData = function(coverage, stats) {
    var xml = '';
    xml += '  <data>\n';
    xml += '    <all name="all classes">\n';
    xml += '      <coverage type="class, %" value="' + calculateCoverage(stats, 'classes') + '"/>\n';
    xml += '      <coverage type="method, %" value="' + calculateCoverage(stats, 'methods') + '"/>\n';
    xml += '      <coverage type="block, %" value="' + calculateCoverage(stats, 'methods') + '"/>\n';
    xml += '      <coverage type="line, %" value="' + calculateCoverage(stats, 'srclines') + '"/>\n';
    xml += '    </all>\n';
    xml += '  </data>\n';
    return xml;
  };

  var dumpFileCoverage = function(savePath, file, outputFile, htmlFragment) {
    var output = savePath + '/coverage/' + outputFile;
    var html = '';
    html += '<html>\n';
    html += '  <head>\n';
    html += '    <title>\n';
    html += '      ' + escapeInvalidXmlChars(file) + '\n';
    html += '    </title>\n';
    html += renderStyle();
    html += '  </head>\n';
    html += '  <body>\n';
    html += '  <div id="mainDiv">\n';
    html += '  <div id="tabPages" class="TabPages">\n';
    html += '  <div class="TabPage selected">\n';
    html += '  <div id="fileDiv">' + escapeInvalidXmlChars(file) + '</div>\n'
    html += '  <div id="sourceDiv">\n';
    html += '    <table id="sourceTable">\n';
    html += htmlFragment;
    html += '    </table>\n';
    html += '    </div>\n';
    html += '    </div>\n';
    html += '    </div>\n';
    html += '    </div>\n';
    html += '  </body>\n';
    html += '</html>\n';
    writeFile(output, html);
  };

  var dumpSummary = function(savePath, stats, htmlFragment) {
    var output = savePath + '/coverage/index.html';
    var html = '';
    html += '<html>\n';
    html += '  <head>\n';
    html += '    <title>Summary</title>\n';
    html += renderStyle();
    html += '  </head>\n';
    html += '  <body>\n';
    html += '  <div id="mainDiv">\n';
    html += '  <div id="tabPages" class="TabPages">\n';
    html += '  <div class="TabPage selected">\n';
    html += '    <div id="summaryDiv">\n'
    html += '    <table id="summaryTable">\n';
    html += '      <tr id="headerRow">';
    html += '        <th class="leftColumn">File</th>';
    html += '        <th>Statements</th>';
    html += '        <th>Executed</th>';
    html += '        <th>Coverage</th>';
    html += '      </tr>\n';
    html += '      <tr id="summaryTotals">';
    html += '        <td class="leftColumn"><span class="title">Total:</span><span>' + stats.srcfilesTotal + '</span></td>';
    html += '        <td class="numeric">' + stats.srclinesTotal + '</td>';
    html += '        <td class="numeric">' + stats.srclinesCovered + '</td>';
    html += renderCoverage(stats.srclinesCovered, stats.srclinesTotal);
    html += '      </tr>\n';
    html += htmlFragment;
    html += '    </table>\n';
    html += '    </div>\n';
    html += '    </div>\n';
    html += '    </div>\n';
    html += '    </div>\n';
    html += '  </body>\n';
    html += '</html>\n';
    writeFile(output, html);
  };

  var reportStats = function(savePath, coverage) {
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
    var summaryHtmlFragment = '';
    for (var file in coverage) {
      if (coverage.hasOwnProperty(file)) {
        stats.classesCovered += 1;
        stats.classesTotal += 1;
        stats.srcfilesCovered += 1;
        stats.srcfilesTotal += 1;
        var srclinesTotal = 0;
        var srclinesCovered = 0;
        var htmlFragment = '';
        for (var i = 0; i < coverage[file].source.length; i += 1) {
          htmlFragment += '<tr><td class="numeric">' + (i + 1) + '</td>';
          if (coverage[file][i + 1] !== void 0) {
            srclinesTotal += 1;
            if (coverage[file][i + 1] > 0) {
              srclinesCovered += 1;
              htmlFragment += '<td class="g numeric">';
            } else {
              htmlFragment += '<td class="r numeric">';
            }
            htmlFragment += coverage[file][i + 1];
          } else {
            htmlFragment += '<td>&nbsp;';
          }
          htmlFragment += '</td><td><pre>' + coverage[file].source[i];
          htmlFragment += '</pre></td></tr>\n';
        }
        stats.srclinesTotal += srclinesTotal;
        stats.srclinesCovered += srclinesCovered;
        var outputFile = file.replace(/[^a-z0-9A-Z]/g, '_') + '.html';
        dumpFileCoverage(savePath, file, outputFile, htmlFragment);
        summaryHtmlFragment += '<tr>';
        summaryHtmlFragment += '<td class="leftColumn"><a href="' + outputFile + '">' + escapeInvalidXmlChars(file) + '</a></td>';
        summaryHtmlFragment += '<td class="numeric">' + srclinesTotal + '</td>';
        summaryHtmlFragment += '<td class="numeric">' + srclinesCovered + '</td>';
        summaryHtmlFragment += renderCoverage(srclinesCovered, srclinesTotal);
        summaryHtmlFragment += '</tr>\n';
      }
    }
    dumpSummary(savePath, stats, summaryHtmlFragment);
    var xml = '';
    xml += '  <stats>\n';
    xml += '    <packages value="' + stats.packagesTotal + '"/>\n';
    xml += '    <classes value="' + stats.classesTotal + '"/>\n';
    xml += '    <methods value="' + stats.methodsTotal + '"/>\n';
    xml += '    <srcfiles value="' + stats.srcfilesTotal + '"/>\n';
    xml += '    <srclines value="' + stats.srclinesTotal + '"/>\n';
    xml += '  </stats>\n';
    return {
      stats : stats,
      xml : xml
    };
  };

  var report = function(savePath, coverage) {
    var xml = '<report>\n';
    var stats = reportStats(savePath, coverage);
    xml += stats.xml;
    xml += reportData(coverage, stats.stats);
    xml += '</report>\n';
    writeFile(savePath + '/coverage.xml', xml);
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
      report(this.savePath, global.top._$jscoverage);
    },

    writeFile : writeFile,

    log : function(str) {
      var console = jasmine.getGlobal().console;

      if (console && console.log) {
        console.log(str);
      }
    }
  };

  // export public
  jasmine.JSCoverageReporter = JSCoverageReporter;
})();
