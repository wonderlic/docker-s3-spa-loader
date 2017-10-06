const AWS = require('aws-sdk');

const promisify = require('../helpers/promisify');

function AwsSimpleStorage(credentials) {
  AWS.config.update(credentials);
  this._s3 = promisify.allFunctions(new AWS.S3());
}

AwsSimpleStorage.prototype.getObject = function(bucketName, objectKey) {
  return this._s3.getObject({Bucket: bucketName, Key: objectKey});
};

module.exports = AwsSimpleStorage;
