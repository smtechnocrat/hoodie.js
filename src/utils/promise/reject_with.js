var getDefer = require('./defer');
var HoodieError = require('../../lib/error/error');

/**
 * Description
 * @method rejectWith
 * @param {} errorProperties
 * @return CallExpression
 */
function rejectWith(errorProperties) {
  var error = new HoodieError(errorProperties);
  return getDefer().reject(error).promise();
}

module.exports = rejectWith;
