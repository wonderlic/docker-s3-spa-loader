const https = require('https');

module.exports.get = function(options) {
  return new Promise(function(resolve, reject) {
    const req = https.get(options, function(res) {

      // reject on bad status
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error('statusCode=' + res.statusCode));
      }

      // cumulate data
      const body = [];
      res.on('data', (data) => {
        body.push(data);
      });

      // resolve on end
      res.on('end', () => {
        resolve(Buffer.concat(body).toString());
      });
    });

    // reject on request error
    req.on('error', reject);
  });
};
