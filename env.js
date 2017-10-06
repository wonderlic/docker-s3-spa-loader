const _ = require('lodash');

const defaults = {
  PORT: '8080',
  TRUST_PROXY: 'true',
  AWS_REGION: 'us-east-1'
};

module.exports = _.merge(defaults, _.pick(process.env, 'PORT', 'TRUST_PROXY', 'AWS_REGION', 'AWS_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME'));
