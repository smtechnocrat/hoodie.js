// Open stores
// -------------

var hoodieRemoteStore = require('../lib/store/remote');
var extend = require('extend');

/**
 * Description
 * @method hoodieOpen
 * @param {} hoodie
 * @return
 */
function hoodieOpen(hoodie) {

  // generic method to open a store.
  //
  //     hoodie.open("some_store_name").findAll()
  //
  /**
   * Description
   * @method open
   * @param {} storeName
   * @param {} options
   * @return CallExpression
   */
  function open(storeName, options) {
    options = options || {};

    extend(options, {
      name: storeName
    });

    return hoodieRemoteStore(hoodie, options);
  }

  //
  // Public API
  //
  hoodie.open = open;
}

module.exports = hoodieOpen;

