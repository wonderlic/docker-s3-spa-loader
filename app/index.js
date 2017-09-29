const _ = require('lodash');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

const env = require('../env');
const promisify = require('../helpers/promisify');
const https = promisify.allMethods(require('https'));

const AwsSimpleStorage = require('../services/AwsSimpleStorage');

function App() {
  _.bindAll(this);

  this._cache = {};
  this.bucketName = env.AWS_S3_BUCKET_NAME;
  this.awsSimpleStorage = new AwsSimpleStorage({
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  });
}

App.prototype.clearCache = errorHandler(function(req, res) {
  this._cache = {};
  res.send('Cache Cleared');
});

App.prototype.clearCacheSnsHandler = errorHandler(function(req, res) {
  if (_.isString(req.body)) { // SNS sends a json Body with a Content-Type of text/plain for some reason
    req.body = JSON.parse(req.body);
  }
  console.log(`HEADERS: ${JSON.stringify(req.headers, null, ' ')}`);
  console.log(`BODY: ${JSON.stringify(req.body, null, ' ')}`);

  const snsMessageType = req.headers['x-amz-sns-message-type'];
  const snsTopicArn = req.headers['x-amz-sns-topic-arn'];

  switch (snsMessageType) {
    case 'SubscriptionConfirmation':
      return subscribe();
    case 'Notification':
      return notification();
    default:
      throw new Error(`Unknown type: '${snsMessageType}'`);
  }

  function subscribe() {
    await(https.get(req.body.SubscribeURL));
    console.log(`Successfully subscribed to SNS topic '${snsTopicArn}'`);
    res.send('OK');
  }

  function notification() {
    console.log(`Received notification from SNS topic '${snsTopicArn}'`);

    // TODO... partial cache clear if only a single file changed...
    this._cache = {};
    res.send('Cache Cleared');
  }
});

App.prototype.request = errorHandler(function(req, res) {
  const hostname = req.hostname.toLowerCase();

  console.log(`HEADERS: ${JSON.stringify(req.headers, null, ' ')}`);

  // TODO... add HTTP->HTTPS redirection...

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
    res.send(cachedLookup.fileContents);
  } else {
    res.status(404).send('Not Found');
  }
});

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

module.exports = new App();
