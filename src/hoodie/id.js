// hoodie.id
// =========

var generateId = require('../utils/generate_id');

// generates a random id and persists using hoodie.config
// until the user signs out or deletes local data
/**
 * Description
 * @method hoodieId
 * @param {} hoodie
 * @return
 */
function hoodieId (hoodie) {
  var id;

  /**
   * Description
   * @method getId
   * @return id
   */
  function getId() {
    if (! id) {
      setId( generateId() );
    }
    return id;
  }

  /**
   * Description
   * @method setId
   * @param {} newId
   * @return
   */
  function setId(newId) {
    id = newId;

    hoodie.config.set('_hoodieId', newId);
  }

  /**
   * Description
   * @method unsetId
   * @return
   */
  function unsetId () {
    id = undefined;
    hoodie.config.unset('_hoodieId');
  }

  //
  // initialize
  //
  /**
   * Description
   * @method init
   * @return
   */
  function init() {
    id = hoodie.config.get('_hoodieId');

    // DEPRECATED, remove before 1.0
    if (! id) {
      hoodie.config.get('_account.ownerHash');
    }
  }

  // allow to run init only once from outside
  /**
   * Description
   * @method init
   * @return
   */
  getId.init = function() {
    init();
    delete getId.init;
  };

  //
  // subscribe to events coming from other modules
  //
  /**
   * Description
   * @method subscribeToOutsideEvents
   * @return
   */
  function subscribeToOutsideEvents() {
    hoodie.on('account:cleanup', unsetId);
    hoodie.on('account:signin', function(username, hoodieId) {
      setId(hoodieId);
    });
  }

  // allow to run this only once from outside
  /**
   * Description
   * @method subscribeToOutsideEvents
   * @return
   */
  getId.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete getId.subscribeToOutsideEvents;
  };

  //
  // Public API
  //
  hoodie.id = getId;
}

module.exports = hoodieId;

