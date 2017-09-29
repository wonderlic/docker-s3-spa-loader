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

App.prototype.clearCache = function(req, res) {
  this._cache = {};
  res.send('Cache Cleared');
};

App.prototype.clearCacheSnsHandler = function(req, res) {
  if (_.isString(req.body)) {
    req.body = JSON.parse(req.body);
  }
  console.log(`HEADERS: ${JSON.stringify(req.headers, null, ' ')}`);
  console.log(`BODY: ${JSON.stringify(req.body, null, ' ')}`);

  const snsMessageType = req.headers['x-amz-sns-message-type'];
  switch (snsMessageType) {
    case 'SubscriptionConfirmation':
      return this.subscribeToSnsTopic(req, res);
    case 'UnsubscriptionConfirmation':
      return this.unsubscribeFromSnsTopic(req, res);
    case 'Notification':
      return this.clearCacheFromS3Event(req, res);
    default:
      throw new Error(`Unknown type: '${snsMessageType}'`);
  }
};

App.prototype.subscriptToSnsTopic = async(function(req, res) {
  const snsTopicArn = req.headers['x-amz-sns-topic-arn'];
  await(https.get(req.body.SubscribeURL));
  console.log(`Successfully subscribed to SNS topic '${snsTopicArn}'`);
  res.send('OK');
});

App.prototype.unsubscriptfromSnsTopic = function(req, res) {
  const snsTopicArn = req.headers['x-amz-sns-topic-arn'];
  console.log(`Successfully unsubscribed from SNS topic '${snsTopicArn}'`);
  res.send('OK');
};

App.prototype.clearCacheFromS3Event = function(req, res) {
  const snsTopicArn = req.headers['x-amz-sns-topic-arn'];
  console.log(`Received clear cache message from SNS topic '${snsTopicArn}'`);

  // TODO... partial cache clear if only a single file changed...
  this._cache = {};
  res.send('Cache Cleared');
};

App.prototype.request = async(function(req, res, next) {
  const hostname = req.hostname.toLowerCase();

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
        console.error(err);
        return next(err);
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

module.exports = new App();
