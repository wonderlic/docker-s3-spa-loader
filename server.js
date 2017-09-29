const env = require('./env');
const express = require('express');
const requestLogger = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');

const app = express();
app.disable('x-powered-by');

app.use(function(req, res, next) {
  // Allows the browser to cache requests, but force the browser to always check back with the server for newer versions of resources
  res.header('Cache-Control', 'must-revalidate, private');
  res.header('Expires', '-1');
  next();
});

// log every request / response
app.use(requestLogger(env.LOG_FORMAT));

// parse the body of incoming requests to json
app.use(bodyParser.json());

// gzip/deflate outgoing responses
app.use(compression());

app.get('/health-check', function(req, res) {
  res.send('OK');
});

const appMethods = require('./app');
app.get('/clear-cache', appMethods.clearCache);
app.post('/sns/clear-cache', appMethods.clearCacheSnsHandler);
app.use(appMethods.request);

// Error logging should be the last thing wired up...
app.use(function(reg, res, next, err) {
  console.err(err);
  res.status(500).send('An Error Occurred.');
});

app.listen(env.PORT, function() {
  console.log('Express server listening on port ' + env.PORT);
});
