const _ = require('lodash');

const defaults = {
  PORT: 8080,
  LOG_FORMAT: 'combined',
  AWS_REGION: 'us-east-1'
};

module.exports = _.merge(defaults, _.pick(process.env, 'PORT', 'LOG_FORMAT', 'AWS_REGION', 'AWS_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME'));
