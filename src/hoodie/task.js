// Tasks
// ============

// This class defines the hoodie.task API.
//
// The returned API provides the following methods:
//
// * start
// * cancel
// * restart
// * remove
// * on
// * one
// * unbind
//
// At the same time, the returned API can be called as function returning a
// store scoped by the passed type, for example
//
//     var emailTasks = hoodie.task('email');
//     emailTasks.start( properties );
//     emailTasks.cancel('id123');
//
var hoodieEvents = require('../lib/events');
var hoodieScopedTask = require('../lib/task/scoped');
var HoodieError = require('../lib/error/error');

var extend = require('extend');

var getDefer = require('../utils/promise/defer');

//
/**
 * Description
 * @method hoodieTask
 * @param {} hoodie
 * @return
 */
function hoodieTask(hoodie) {

  // public API
  /**
   * Description
   * @method api
   * @param {} type
   * @param {} id
   * @return CallExpression
   */
  var api = function api(type, id) {
      return hoodieScopedTask(hoodie, api, {
        type: type,
        id: id
      });
    };

  // add events API
  hoodieEvents(hoodie, {
    context: api,
    namespace: 'task'
  });


  // start
  // -------

  // start a new task. If the user has no account yet, hoodie tries to sign up
  // for an anonymous account in the background. If that fails, the returned
  // promise will be rejected.
  //
  /**
   * Description
   * @method start
   * @param {} type
   * @param {} properties
   * @return CallExpression
   */
  api.start = function(type, properties) {
    if (hoodie.account.hasAccount()) {
      return hoodie.store.add('$' + type, properties).then(handleNewTask);
    }

    return hoodie.account.anonymousSignUp().then(function() {
      return api.start(type, properties);
    });
  };


  // cancel
  // -------

  // cancel a running task
  //
  /**
   * Description
   * @method cancel
   * @param {} type
   * @param {} id
   * @return CallExpression
   */
  api.cancel = function(type, id) {
    return hoodie.store.update('$' + type, id, {
      cancelledAt: now()
    }).then(handleCancelledTaskObject);
  };


  // restart
  // ---------

  // first, we try to cancel a running task. If that succeeds, we start
  // a new one with the same properties as the original
  //
  /**
   * Description
   * @method restart
   * @param {} type
   * @param {} id
   * @param {} update
   * @return CallExpression
   */
  api.restart = function(type, id, update) {
    /**
     * Description
     * @method start
     * @param {} object
     * @return CallExpression
     */
    var start = function(object) {
      extend(object, update);
      delete object.$error;
      delete object.$processedAt;
      delete object.cancelledAt;
      return api.start(object.type, object);
    };
    return api.cancel(type, id).then(start);
  };

  // cancelAll
  // -----------

  //
  /**
   * Description
   * @method cancelAll
   * @param {} type
   * @return CallExpression
   */
  api.cancelAll = function(type) {
    return findAll(type).then(cancelTaskObjects);
  };

  // restartAll
  // -----------

  //
  /**
   * Description
   * @method restartAll
   * @param {} type
   * @param {} update
   * @return CallExpression
   */
  api.restartAll = function(type, update) {

    if (typeof type === 'object') {
      update = type;
    }
    return findAll(type).then(function(taskObjects) {
      restartTaskObjects(taskObjects, update);
    });

  };


  //
  // subscribe to store events
  // we subscribe to all store changes, pipe through the task ones,
  // making a few changes along the way.
  //
  /**
   * Description
   * @method subscribeToOutsideEvents
   * @return
   */
  function subscribeToOutsideEvents() {
    // account events
    hoodie.on('store:change', handleStoreChange);
  }

  // allow to run this only once from outside (during Hoodie initialization)
  /**
   * Description
   * @method subscribeToOutsideEvents
   * @return
   */
  api.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete api.subscribeToOutsideEvents;
  };


  // Private
  // -------

  //
  /**
   * Description
   * @method handleNewTask
   * @param {} object
   * @return CallExpression
   */
  function handleNewTask(object) {
    var defer = getDefer();
    var taskStore = hoodie.store(object.type, object.id);

    taskStore.on('remove', function(object) {

      // remove "$" from type
      object.type = object.type.substr(1);

      // task finished by worker.
      if (object.$processedAt) {
        return defer.resolve(object);
      }

      // manually removed / cancelled.
      defer.reject(new HoodieError({
        message: 'Task has been cancelled',
        task: object
      }));
    });
    taskStore.on('update', function(object) {
      var error = object.$error;

      if (! object.$error) {
        return;
      }

      // remove "$" from type
      object.type = object.type.substr(1);

      delete object.$error;
      error.object = object;
      error.message = error.message || 'Something went wrong';

      defer.reject(new HoodieError(error));

      // remove errored task
      hoodie.store.remove('$' + object.type, object.id);
    });

    return defer.promise();
  }

  //
  /**
   * Description
   * @method handleCancelledTaskObject
   * @param {} taskObject
   * @return CallExpression
   */
  function handleCancelledTaskObject(taskObject) {
    var defer;
    var type = taskObject.type; // no need to prefix with $, it's already prefixed.
    var id = taskObject.id;
    var removePromise = hoodie.store.remove(type, id);

    if (!taskObject._rev) {
      // task has not yet been synced.
      return removePromise;
    }

    defer = getDefer();
    hoodie.one('store:sync:' + type + ':' + id, defer.resolve);
    removePromise.fail(defer.reject);

    return defer.promise();
  }

  //
  /**
   * Description
   * @method handleStoreChange
   * @param {} eventName
   * @param {} object
   * @param {} options
   * @return
   */
  function handleStoreChange(eventName, object, options) {
    if (object.type[0] !== '$') {
      return;
    }

    object.type = object.type.substr(1);
    triggerEvents(eventName, object, options);
  }

  //
  /**
   * Description
   * @method findAll
   * @param {} type
   * @return CallExpression
   */
  function findAll(type) {
    var startsWith = '$';
    var filter;
    if (type) {
      startsWith += type;
    }

    /**
     * Description
     * @param {} object
     * @return BinaryExpression
     */
    filter = function(object) {
      return object.type.indexOf(startsWith) === 0;
    };
    return hoodie.store.findAll(filter);
  }

  //
  /**
   * Description
   * @method cancelTaskObjects
   * @param {} taskObjects
   * @return CallExpression
   */
  function cancelTaskObjects(taskObjects) {
    return taskObjects.map(function(taskObject) {
      return api.cancel(taskObject.type.substr(1), taskObject.id);
    });
  }

  //
  /**
   * Description
   * @method restartTaskObjects
   * @param {} taskObjects
   * @param {} update
   * @return CallExpression
   */
  function restartTaskObjects(taskObjects, update) {
    return taskObjects.map(function(taskObject) {
      return api.restart(taskObject.type.substr(1), taskObject.id, update);
    });
  }

  // this is where all the task events get triggered,
  // like add:message, change:message:abc4567, remove, etc.
  /**
   * Description
   * @method triggerEvents
   * @param {} eventName
   * @param {} task
   * @param {} options
   * @return
   */
  function triggerEvents(eventName, task, options) {
    var error;

    // "new" tasks are trigger as "start" events
    if (eventName === 'add') {
      eventName = 'start';
    }

    if (eventName === 'remove' && task.cancelledAt) {
      eventName = 'cancel';
    }

    if (eventName === 'remove' && task.$processedAt) {
      eventName = 'success';
    }

    if (eventName === 'update' && task.$error) {
      eventName = 'error';
      error = task.$error;
      delete task.$error;

      api.trigger('error', error, task, options);
      api.trigger(task.type + ':error', error, task, options);
      api.trigger(task.type + ':' + task.id + ':error', error, task, options);

      options = extend({}, options, {
        error: error
      });

      api.trigger('change', 'error', task, options);
      api.trigger(task.type + ':change', 'error', task, options);
      api.trigger(task.type + ':' + task.id + ':change', 'error', task, options);

      return;
    }

    // ignore all the other events
    if (eventName !== 'start' && eventName !== 'cancel' && eventName !== 'success') {
      return;
    }

    api.trigger(eventName, task, options);
    api.trigger(task.type + ':' + eventName, task, options);

    if (eventName !== 'start') {
      api.trigger(task.type + ':' + task.id + ':' + eventName, task, options);
    }

    api.trigger('change', eventName, task, options);
    api.trigger(task.type + ':change', eventName, task, options);

    if (eventName !== 'start') {
      api.trigger(task.type + ':' + task.id + ':change', eventName, task, options);
    }
  }

  //
  /**
   * Description
   * @method now
   * @return CallExpression
   */
  function now() {
    return JSON.stringify(new Date()).replace(/['"]/g, '');
  }

  // extend hoodie
  hoodie.task = api;
}

module.exports = hoodieTask;

