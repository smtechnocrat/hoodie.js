var i, radix;

// uuids consist of numbers and lowercase letters only.
// We stick to lowercase letters to prevent confusion
// and to prevent issues with CouchDB, e.g. database
// names do wonly allow for lowercase letters.
var chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
var radix = chars.length;

// helper to generate unique ids.
/**
 * Description
 * @method generateId
 * @param {} length
 * @return id
 */
function generateId (length) {
  var id = '';

  // default uuid length to 7
  if (length === undefined) {
    length = 7;
  }

  for (i = 0; i < length; i++) {
    var rand = Math.random() * radix;
    var char = chars[Math.floor(rand)];
    id += String(char).charAt(0);
  }

  return id;
}

module.exports = generateId;
