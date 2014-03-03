// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object types, plus must start
// with a letter.
//
var HoodieError = require('./error');

// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object types, plus must start
// with a letter.
//
/**
 * Description
 * @method HoodieObjectTypeError
 * @param {} properties
 * @return NewExpression
 */
function HoodieObjectTypeError(properties) {
  properties.name = 'HoodieObjectTypeError';
  properties.message = '"{{type}}" is invalid object type. {{rules}}.';

  return new HoodieError(properties);
}
var validTypePattern = /^[a-z$][a-z0-9]+$/;
/**
 * Description
 * @method isInvalid
 * @param {} type
 * @param {} customPattern
 * @return UnaryExpression
 */
HoodieObjectTypeError.isInvalid = function(type, customPattern) {
  return !(customPattern || validTypePattern).test(type || '');
};
/**
 * Description
 * @method isValid
 * @param {} type
 * @param {} customPattern
 * @return CallExpression
 */
HoodieObjectTypeError.isValid = function(type, customPattern) {
  return (customPattern || validTypePattern).test(type || '');
};
HoodieObjectTypeError.prototype.rules = 'lowercase letters, numbers and dashes allowed only. Must start with a letter';

module.exports = HoodieObjectTypeError;

