const _ = require('lodash');

const defaults = {
  PORT: '8080',
  TRUST_PROXY: 'true',
  REDIRECT_INSECURE: 'true',
};

module.exports = _.merge(defaults, _.pick(process.env, 'PORT', 'TRUST_PROXY', 'REDIRECT_INSECURE', 'AWS_S3_BUCKET_NAME'));
