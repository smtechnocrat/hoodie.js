var getDefer = require('./defer');

/**
 * Description
 * @method resolveWith
 * @return CallExpression
 */
function resolveWith() {
  var defer = getDefer();
  return defer.resolve.apply(defer, arguments).promise();
}

module.exports = resolveWith;
