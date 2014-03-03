// scoped Store
// ============

// same as store, but with type preset to an initially
// passed value.
//
var hoodieEvents = require('../events');

//
/**
 * Description
 * @method hoodieScopedTask
 * @param {} hoodie
 * @param {} taskApi
 * @param {} options
 * @return api
 */
function hoodieScopedTask(hoodie, taskApi, options) {

  var type = options.type;
  var id = options.id;

  var api = {};

  // scoped by type only
  if (!id) {

    // add events
    hoodieEvents(hoodie, {
      context: api,
      namespace: 'task:' + type
    });

    //
    /**
     * Description
     * @method start
     * @param {} properties
     * @return CallExpression
     */
    api.start = function start(properties) {
      return taskApi.start(type, properties);
    };

    //
    /**
     * Description
     * @method cancel
     * @param {} id
     * @return CallExpression
     */
    api.cancel = function cancel(id) {
      return taskApi.cancel(type, id);
    };

    //
    /**
     * Description
     * @method restart
     * @param {} id
     * @param {} update
     * @return CallExpression
     */
    api.restart = function restart(id, update) {
      return taskApi.restart(type, id, update);
    };

    //
    /**
     * Description
     * @method cancelAll
     * @return CallExpression
     */
    api.cancelAll = function cancelAll() {
      return taskApi.cancelAll(type);
    };

    //
    /**
     * Description
     * @method restartAll
     * @param {} update
     * @return CallExpression
     */
    api.restartAll = function restartAll(update) {
      return taskApi.restartAll(type, update);
    };
  }

  // scoped by both: type & id
  if (id) {

    // add events
    hoodieEvents(hoodie, {
      context: api,
      namespace: 'task:' + type + ':' + id
    });

    //
    /**
     * Description
     * @method cancel
     * @return CallExpression
     */
    api.cancel = function cancel() {
      return taskApi.cancel(type, id);
    };

    //
    /**
     * Description
     * @method restart
     * @param {} update
     * @return CallExpression
     */
    api.restart = function restart(update) {
      return taskApi.restart(type, id, update);
    };
  }

  return api;
}

module.exports = hoodieScopedTask;

