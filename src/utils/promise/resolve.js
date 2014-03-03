var defer = require('./defer');

/**
 * Description
 * @method resolve
 * @return CallExpression
 */
function resolve() {
  return defer().resolve().promise();
}

module.exports = resolve;
