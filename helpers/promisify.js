const _ = require('lodash');

function Promisify() {}

Promisify.prototype.allFunctions = function(obj) {
  return _.mapValues(_.pick(obj, _.functions(obj)), (method) => {
    return this.function(method.bind(obj));
  });
};

Promisify.prototype.function = function(fn) {
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
};

module.exports = new Promisify();
