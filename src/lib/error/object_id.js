// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object IDs.
//
var HoodieError = require('./error');

//
/**
 * Description
 * @method HoodieObjectIdError
 * @param {} properties
 * @return NewExpression
 */
function HoodieObjectIdError(properties) {
  properties.name = 'HoodieObjectIdError';
  properties.message = '"{{id}}" is invalid object id. {{rules}}.';

  return new HoodieError(properties);
}
var validIdPattern = /^[a-z0-9\-]+$/;
/**
 * Description
 * @method isInvalid
 * @param {} id
 * @param {} customPattern
 * @return UnaryExpression
 */
HoodieObjectIdError.isInvalid = function(id, customPattern) {
  return !(customPattern || validIdPattern).test(id || '');
};
/**
 * Description
 * @method isValid
 * @param {} id
 * @param {} customPattern
 * @return CallExpression
 */
HoodieObjectIdError.isValid = function(id, customPattern) {
  return (customPattern || validIdPattern).test(id || '');
};
HoodieObjectIdError.prototype.rules = 'Lowercase letters, numbers and dashes allowed only. Must start with a letter';

module.exports = HoodieObjectIdError;

