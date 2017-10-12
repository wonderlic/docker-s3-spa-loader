const _ = require('lodash');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

const env = require('./env');
const https = require('./helpers/https');

const AwsSimpleStorage = require('./services/AwsSimpleStorage');

function Handlers() {
  _.bindAll(this);

  this._cache = {};
  this.bucketName = env.AWS_S3_BUCKET_NAME;
  this.awsSimpleStorage = new AwsSimpleStorage({
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  });
}

Handlers.prototype.clearCache = errorHandler(function(req, res) {
  this._cache = {};

  log(req, 200, 'Cache Cleared');
  res.send('OK');
});

Handlers.prototype.snsClearCache = errorHandler(function(req, res) {
  const self = this;

  if (_.isString(req.body)) { // SNS sends a json Body with a Content-Type of text/plain for some reason
    req.body = JSON.parse(req.body);
  }
  //console.log(`HEADERS: ${JSON.stringify(req.headers, null, ' ')}`);
  //console.log(`BODY: ${JSON.stringify(req.body, null, ' ')}`);

  const snsMessageType = req.headers['x-amz-sns-message-type'];
  const snsTopicArn = req.headers['x-amz-sns-topic-arn'];

  switch (snsMessageType) {
    case 'SubscriptionConfirmation':
      return subscribe();
    case 'Notification':
      return notification();
    default:
      throw new Error(`Unknown SNS message type: '${snsMessageType}'`);
  }

  function subscribe() {
    console.log(`Received SubscriptionConfirmation from SNS topic '${snsTopicArn}'`);
    await(https.get(req.body.SubscribeURL));

    log(req, 200, `Successfully subscribed to SNS topic: ${snsTopicArn}`);
    res.send('OK');
  }

  function notification() {
    console.log(`Received Notification from SNS topic '${snsTopicArn}'`);

    const message = JSON.parse(req.body.Message);
    //console.log(`Message: ${JSON.stringify(message, null, ' ')}`);

    const objectKeys = _.compact(_.map(message.Records, function(record) {
      return _.get(record, 's3.object.key');
    }));
    //console.log(`objectKeys: ${objectKeys}`);

    for (const objectKey of objectKeys) {
      if (self._cache[objectKey]) {
        delete self._cache[objectKey];
      }
    }

    log(req, 200, `Cleared ${objectKeys} from Cache`);
    res.send(`OK`);
  }
});

Handlers.prototype.request = errorHandler(function(req, res) {
  const hostname = req.hostname.toLowerCase();

  //console.log(`${req.ip} ${req.method} ${req.protocol}://${req.hostname}${req.originalUrl}`);
  //console.log(`HEADERS: ${JSON.stringify(req.headers, null, ' ')}`);

  // HTTP -> HTTPS redirection...
  if (!req.secure) {
    const newUrl = `https://${req.hostname}${req.originalUrl}`;

    log(req, 301, `Redirected to secure url: ${newUrl}`);
    return res.redirect(301, newUrl);
  }

  let cachedLookup = this._cache[hostname];
  if (!cachedLookup) {
    try {
      const s3Object = await(this.awsSimpleStorage.getObject(this.bucketName, hostname));
      cachedLookup = {fileContents: s3Object.Body.toString()};
    } catch (err) {
      if (_.get(err, 'code') === 'NoSuchKey') {
        cachedLookup = {notFound: true};
      } else {
        throw err;
      }
    }
    this._cache[hostname] = cachedLookup;
  }

  if (cachedLookup.fileContents) {
    log(req, 200, `Served up SPA for: ${hostname} size: ${cachedLookup.fileContents.length}`);
    res.send(cachedLookup.fileContents);
  } else {
    log(req, 404, `Could not find SPA for: ${hostname}`);
    res.status(404).send('Not Found');
  }
});

Handlers.prototype.error = function(err, req, res, next) {
  err.code = err.status || err.code || 500;
  log(req, err.code, `Error: ${err.message})`);
  console.error(err.stack);
  if (!res.headersSent) {
    res.status(err.code).send('An Error Occurred.');
  } else if (next) {
    next(err);
  } else {
    console.error('No further error handling.');
  }
};

function log(req, status, result) {
  const requestUrl = `${req.protocol}://${req.hostname}${req.path}`;
  const now = new Date();
  const ms = now - req.startTime;
  console.log(`${now.toISOString()} ${req.ip} ${req.method} ${requestUrl} "${req.headers['user-agent']}" -> ${status} ${ms}ms "${result}"`);
}

function errorHandler(handler) {
  return async(function(req, res, next) {
    try {
      await(handler.apply(this, arguments));
    } catch (err) {
      if (next) {
        next(err);
      } else {
        throw err;
      }
    }
  });
}

module.exports = new Handlers();
