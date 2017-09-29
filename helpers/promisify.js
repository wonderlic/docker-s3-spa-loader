const _ = require('lodash');

function Promisify() {}

Promisify.prototype.allMethods = function(obj) {
  return _.mapValues(_.pick(obj, _.functions(obj)), function(method) {
    return promisify(method.bind(obj));
  });
};

function promisify(fn) {
  return function() {
    const context = this;
    const args = _.toArray(arguments);
    return new Promise(function(resolve, reject) {
      fn.apply(context, args.concat(function(error, result) {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }));
    });
  };
}

module.exports = new Promisify();
