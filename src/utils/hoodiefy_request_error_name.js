var findLettersToUpperCase = /(^\w|_\w)/g;

/**
 * Description
 * @method hoodiefyRequestErrorName
 * @param {} name
 * @return BinaryExpression
 */
function hoodiefyRequestErrorName (name) {
  name = name.replace(findLettersToUpperCase, function (match) {
    return (match[1] || match[0]).toUpperCase();
  });

  return 'Hoodie' + name + 'Error';
}

module.exports = hoodiefyRequestErrorName;
