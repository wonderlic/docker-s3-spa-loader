const _ = require('lodash');

const config = require('./config');

function Handlers() {
  _.bindAll(this, _.functionsIn(this));

  this._cache = {};
  this.bucketName = config.awsS3BucketName;

  if (config.pusherKey) {
    const Pusher = require('pusher-js');
    const pusher = new Pusher(config.pusherKey, {APP_CLUSTER: config.pusherCluster});
    const channel = pusher.subscribe(config.pusherChannel);
    channel.bind('event', (data) => {
      console.log(`Received Pusher channel event`);
      if (data && data.objectKey && this._cache[data.objectKey]) {
        delete this._cache[data.objectKey];
        console.log(`Cleared [${data.objectKey}] from Cache`);
      }
    });

    // Pusher automatically tries to reconnect. This will let us know when its trying.
    pusher.connection.bind('state_change', (states) => {
      console.log(
        `Connection state changed from ${states.previous} to ${states.current}`
      );
      if (states.current === 'connecting') {
        console.log('Attempting to reconnect to pusher...');
      } else if (states.current === 'connected') {
        console.log('Reconnected to pusher successfully.');
      }
    });

    pusher.connection.bind('error', (err) => {
      console.error('pusher connection error:', JSON.stringify(err));
    });
  } else {
    console.log('No pusher key configured');
  }
}

Handlers.prototype.clearCache = errorHandler(function (req, res) {
  this._cache = {};

  log(req, 200, 'Cache Cleared');
  res.send('OK');
});

Handlers.prototype.snsClearCache = errorHandler(function (req, res) {
  const self = this;

  if (_.isString(req.body)) {
    // SNS sends a json Body with a Content-Type of text/plain for some reason
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
    return httpsGet(req.body.SubscribeURL).then(() => {
      log(req, 200, `Successfully subscribed to SNS topic: ${snsTopicArn}`);
      res.send('OK');
    });
  }

  function notification() {
    console.log(`Received Notification from SNS topic '${snsTopicArn}'`);

    const message = JSON.parse(req.body.Message);
    //console.log(`Message: ${JSON.stringify(message, null, ' ')}`);
    const objectKeys = _.compact(
      _.map(message.Records, function (record) {
        return _.get(record, 's3.object.key');
      })
    );
    //console.log(`objectKeys: ${objectKeys}`);

    for (const objectKey of objectKeys) {
      if (self._cache[objectKey]) {
        delete self._cache[objectKey];
      }
    }

    log(req, 200, `Cleared [${objectKeys}] from Cache`);
    res.send(`OK`);
  }
});

Handlers.prototype.request = errorHandler(function (req, res) {
  //console.log(`${req.ip} ${req.method} ${req.protocol}://${req.hostname}${req.originalUrl}`);
  //console.log(`HEADERS: ${JSON.stringify(req.headers, null, ' ')}`);

  // HTTP -> HTTPS redirection...
  if (!req.secure && config.redirectInsecure) {
    const newUrl = `https://${req.hostname}${req.originalUrl}`;

    log(req, 301, `Redirected to secure url: ${newUrl}`);
    return res.redirect(301, newUrl);
  }

  const hostname = req.hostname.toLowerCase();
  const path = req.path.toLowerCase();

  let fileType = 'SPA';
  let key = hostname;
  if (_.includes(['/favicon.ico', '/robots.txt'], path)) {
    fileType = path;
    key += path;
  }

  return this._getS3FileFromCache(key).then((file) => {
    if (file.fileContents) {
      log(req, 200, `Served up ${fileType} for: ${hostname}, size: ${file.fileContents.length}`);

      if (_.endsWith(key, '.ico')) {
        res.setHeader('content-type', 'image/x-icon');
      } else if (_.endsWith(key, '.txt')) {
        res.setHeader('content-type', 'text/plain');
      } else {
        res.setHeader('content-type', 'text/html');
        if (req.secure) {
          res.setHeader('Strict-Transport-Security', 'max-age=7776000');
        }
      }

      if (file.cacheControl) {
        res.setHeader('Cache-Control', file.cacheControl);
      }

      res.send(file.fileContents);
    } else {
      log(req, 404, `Could not find ${fileType} for: ${hostname}`);
      res.status(404).send('Not Found');
    }
  });
});

Handlers.prototype._getS3FileFromCache = function (key) {
  if (_.isEmpty(key)) {
    return Promise.resolve({ notFound: true });
  }
  const file = this._cache[key];
  if (file) {
    return Promise.resolve(file);
  }

  return httpGet(`http://${this.bucketName}.s3.amazonaws.com/${key}`)
    .then(({ fileContents, cacheControl }) => {
      return this._addS3FileToCache(key, { fileContents, cacheControl });
    })
    .catch((err) => {
      if (_.get(err, 'code') === 404) {
        return this._addS3FileToCache(key, { notFound: true });
      } else {
        throw err;
      }
    });
};

Handlers.prototype._addS3FileToCache = function (key, file) {
  this._cache[key] = file;
  return file;
};

Handlers.prototype.error = function (err, req, res, next) {
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
  console.log(`${now.toISOString()} ${status} ${ms}ms "${result}" <- ${req.ip} ${req.method} ${requestUrl} "${req.headers['user-agent']}"`);
}

function errorHandler(handler) {
  return function (req, res, next) {
    Promise.resolve(handler.apply(this, arguments)).catch((err) => {
      if (next) {
        next(err);
      } else {
        throw err;
      }
    });
  };
}

function httpGet(options) {
  return getWrapper(require('http'), options);
}
function httpsGet(options) {
  return getWrapper(require('https'), options);
}
function getWrapper(http, options) {
  return new Promise(function (resolve, reject) {
    const req = http.get(options, function (res) {
      // Reject on bad status
      if (res.statusCode < 200 || res.statusCode >= 300) {
        const err = new Error(`Request returned status code: ${res.statusCode}`);
        err.code = res.statusCode;
        return reject(err);
      }

      // Accumulate Body data
      const body = [];
      res.on('data', (data) => {
        body.push(data);
      });

      // Resolve on end
      res.on('end', () => {
        resolve({
          fileContents: Buffer.concat(body),
          cacheControl: res.headers['cache-control'],
        });
      });
    });

    // Reject on request error
    req.on('error', reject);
  });
}

module.exports = new Handlers();
