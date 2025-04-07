const defaults = {
  PORT: '8080',
  TRUST_PROXY: 'true',
  REDIRECT_INSECURE: 'true',
  PUSHER_CHANNEL: 's3-spa-event',
};

function getEnvVar(key) {
  return process.env[key] || defaults[key];
}
function getIntEnvVar(key) {
  return parseInt(getEnvVar(key));
}
function getBoolEnvVar(key) {
  return getEnvVar(key) === 'true';
}

const config = {
  port: getIntEnvVar('PORT'),
  trustProxy: getBoolEnvVar('TRUST_PROXY'),
  redirectInsecure: getBoolEnvVar('REDIRECT_INSECURE'),
  awsS3BucketName: getEnvVar('AWS_S3_BUCKET_NAME'),
  pusherKey: getEnvVar('PUSHER_KEY'),
  pusherChannel: getEnvVar('PUSHER_CHANNEL'),
};

console.log(`config: ${JSON.stringify(config, null, ' ')}`);

module.exports = config;
