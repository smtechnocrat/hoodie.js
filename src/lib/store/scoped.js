// scoped Store
// ============

// same as store, but with type preset to an initially
// passed value.
//
var hoodieEvents = require('../events');

//
/**
 * Description
 * @method hoodieScopedStoreApi
 * @param {} hoodie
 * @param {} storeApi
 * @param {} options
 * @return api
 */
function hoodieScopedStoreApi(hoodie, storeApi, options) {

  // name
  var storeName = options.name || 'store';
  var type = options.type;
  var id = options.id;

  var api = {};

  // scoped by type only
  if (!id) {

    // add events
    hoodieEvents(hoodie, {
      context: api,
      namespace: storeName + ':' + type
    });

    //
    /**
     * Description
     * @method save
     * @param {} id
     * @param {} properties
     * @param {} options
     * @return CallExpression
     */
    api.save = function save(id, properties, options) {
      return storeApi.save(type, id, properties, options);
    };

    //
    /**
     * Description
     * @method add
     * @param {} properties
     * @param {} options
     * @return CallExpression
     */
    api.add = function add(properties, options) {
      return storeApi.add(type, properties, options);
    };

    //
    /**
     * Description
     * @method find
     * @param {} id
     * @return CallExpression
     */
    api.find = function find(id) {
      return storeApi.find(type, id);
    };

    //
    /**
     * Description
     * @method findOrAdd
     * @param {} id
     * @param {} properties
     * @return CallExpression
     */
    api.findOrAdd = function findOrAdd(id, properties) {
      return storeApi.findOrAdd(type, id, properties);
    };

    //
    /**
     * Description
     * @method findAll
     * @param {} options
     * @return CallExpression
     */
    api.findAll = function findAll(options) {
      return storeApi.findAll(type, options);
    };

    //
    /**
     * Description
     * @method update
     * @param {} id
     * @param {} objectUpdate
     * @param {} options
     * @return CallExpression
     */
    api.update = function update(id, objectUpdate, options) {
      return storeApi.update(type, id, objectUpdate, options);
    };

    //
    /**
     * Description
     * @method updateAll
     * @param {} objectUpdate
     * @param {} options
     * @return CallExpression
     */
    api.updateAll = function updateAll(objectUpdate, options) {
      return storeApi.updateAll(type, objectUpdate, options);
    };

    //
    /**
     * Description
     * @method remove
     * @param {} id
     * @param {} options
     * @return CallExpression
     */
    api.remove = function remove(id, options) {
      return storeApi.remove(type, id, options);
    };

    //
    /**
     * Description
     * @method removeAll
     * @param {} options
     * @return CallExpression
     */
    api.removeAll = function removeAll(options) {
      return storeApi.removeAll(type, options);
    };
  }

  // scoped by both: type & id
  if (id) {

    // add events
    hoodieEvents(hoodie, {
      context: api,
      namespace: storeName + ':' + type + ':' + id
    });

    //
    /**
     * Description
     * @method save
     * @param {} properties
     * @param {} options
     * @return CallExpression
     */
    api.save = function save(properties, options) {
      return storeApi.save(type, id, properties, options);
    };

    //
    /**
     * Description
     * @method find
     * @return CallExpression
     */
    api.find = function find() {
      return storeApi.find(type, id);
    };

    //
    /**
     * Description
     * @method update
     * @param {} objectUpdate
     * @param {} options
     * @return CallExpression
     */
    api.update = function update(objectUpdate, options) {
      return storeApi.update(type, id, objectUpdate, options);
    };

    //
    /**
     * Description
     * @method remove
     * @param {} options
     * @return CallExpression
     */
    api.remove = function remove(options) {
      return storeApi.remove(type, id, options);
    };
  }

  //
  api.decoratePromises = storeApi.decoratePromises;
  api.validate = storeApi.validate;

  return api;
}

module.exports = hoodieScopedStoreApi;

