const async = require('asyncawait/async');
const await = require('asyncawait/await');
const AWS = require('aws-sdk');

const promisify = require('../helpers/promisify');

function AwsSimpleStorage(credentials) {
  AWS.config.update(credentials);
  this._s3 = promisify.allMethods(new AWS.S3());
}

AwsSimpleStorage.prototype.getObject = async(function(bucketName, objectKey) {
  return await(this._s3.getObject({Bucket: bucketName, Key: objectKey}));
});

module.exports = AwsSimpleStorage;
