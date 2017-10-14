const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');

const config = require('./config');

const app = express();
app.disable('x-powered-by');

if (config.trustProxy) {
  console.log('Trusting proxy headers');
  app.enable('trust proxy');
}

app.get('/heartbeat', function(req, res) { res.send('alive'); });

app.use(function(req, res, next) {
  req.startTime = new Date();
  // Allows the browser to cache requests, but force the browser to always check back with the server for newer versions of resources
  res.header('Cache-Control', 'must-revalidate, private');
  res.header('Expires', '-1');
  next();
});

// parse the body of incoming requests to text/json
app.use(bodyParser.text());
app.use(bodyParser.json());

// gzip/deflate outgoing responses
app.use(compression());

const handlers = require('./handlers');
app.get('/clear-cache', handlers.clearCache);
app.post('/sns/clear-cache', handlers.snsClearCache);
app.use(handlers.request);

// Error logging should be the last thing wired up...
app.use(handlers.error);

app.listen(config.port, function() {
  console.log('Express server listening on port ' + config.port);
});
