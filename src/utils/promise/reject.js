var defer = require('./defer');

/**
 * Description
 * @method reject
 * @return CallExpression
 */
function reject() {
  return defer().reject().promise();
}

module.exports = reject;
