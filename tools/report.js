if (process.argv.length < 3) {
  console.log('Usage: node report.js <report directory>');
  process.exit(1);
}

var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');

var MIME = {
  'default': 'application/octet-stream',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.gif': 'image/gif'
};
var PORT = process.env.PORT || 8080;

http.createServer(function(request, response) {
  var parsedUrl = url.parse(request.url);
  if (parsedUrl.pathname === '/') {
    parsedUrl.pathname = '/jscoverage.html';
  }
  var filename = path.join(process.argv[2], parsedUrl.pathname);
  fs.stat(filename, function(err, status) {
    if (err) {
      response.writeHead(404);
      return response.end();
    }
    var mime = MIME[path.extname(parsedUrl.pathname)] ||  MIME['default'];
    response.writeHead(200, {
      'Content-Type': mime
    });
    var file = fs.ReadStream(filename);
    file.pipe(response);
  });
}).listen(PORT);

console.log('Server running at http://127.0.0.1:' + PORT);
